import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import transliteration from 'transliteration';
import fontkit from '@pdf-lib/fontkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDF Field Coordinates Configuration
 * 
 * IMPORTANT: These coordinates correspond to the red dots in Order_with_grid.pdf
 * The data from travel orders will be filled at these exact positions.
 * 
 * To find/adjust the correct coordinates for your PDF template:
 * 1. Run: node backend/scripts/find-pdf-coordinates.js
 * 2. Open the generated Order_with_grid.pdf
 * 3. The red dots show where data will be placed
 * 4. To move a field: Edit field-coordinates.json, then run: node backend/scripts/sync-coordinates.js
 * 
 * Note: PDF coordinates start from bottom-left corner (0,0)
 * y = height - (distance from top in points)
 * offsetFromTop = distance from top edge in points
 * 
 * Current page size: 792 x 612 points (as shown in Order_with_grid.pdf)
 */
const FIELD_COORDINATES = {
  // City field: "До гр.(с.)"
  city: { x: 100, y: 389, offsetFromTop: null, size: 8 },
  
  // Country field: "в"
  country: { x: 200, y: null, offsetFromTop: 160, size: 9 },
  
  // Task/Notes field: "със задача"
  task: { x: 105, y: 356, offsetFromTop: null, size: 8 },
  
  // Period field: "за срок от      дни  от           до"
  // This field contains: days, start date, end date
  period: { x: 50, y: 380, offsetFromTop: null, size: 8 },
  periodDays: { x: 120, y: 367, offsetFromTop: null, size: 8 },
  periodStartDate: { x: 190, y: 367, offsetFromTop: null, size: 8 },
  periodEndDate: { x: 320, y: 367, offsetFromTop: null, size: 8 },
  
  // Daily allowance field: "Дневни пари по"
  dailyAllowance: { x: 140, y: 325, offsetFromTop: null, size: 8},
  
  // Other fields (existing)
  orderNumber: { x: 180, y: 460, offsetFromTop: null, size: 8 },
  orderDate: { x: 270, y: 460, offsetFromTop: null, size: 8 },
  employeeName: { x:190 , y: 410, offsetFromTop: null, size: 8 },
  startDate: { x: 450, y: 420, offsetFromTop: null, size: 8 },
  endDate: { x: 450, y: 420, offsetFromTop: null, size: 8 },
  totalDays: { x: 510, y: 290, offsetFromTop: null, size: 8 },
  
  // Expense table section - Row 1 (outbound)
  expenseOutboundDate: { x: 453, y:410 , offsetFromTop: null, size: 8 },
  expenseOutboundRoute: { x: 510, y: 410, offsetFromTop: null ,size: 8 },
  
  // Expense table section - Row 2 (return)
  expenseReturnDate: { x: 453, y: 400, offsetFromTop: null, size: 8 },
  expenseReturnRoute: { x: 510, y: 400, offsetFromTop: null, size: 8 },
  
  // Daily allowance calculation section
  calcTotalDays: { x: 520, y: 290, offsetFromTop: null ,size: 8 },
  calcDailyAllowance: { x: 580, y: 290, offsetFromTop: null, size: 8 },
  calcTotalAllowance: { x: 640, y: 290, offsetFromTop: null, size: 8 },
  
  // Total amount
  totalAmount: { x: 620, y:260, offsetFromTop: null, size: 8 },
  
  // Approver name
  approverName: { x: 450, y: 180, offsetFromTop: null, size: 8 },
  
  // Approval date (bottom section)
  approvalDate: { x: 460, y: 140, offsetFromTop: null, size: 8 },
};

/**
 * Helper function to calculate y coordinate from top offset or use direct y value
 */
const getYCoordinate = (fieldConfig, pageHeight) => {
  // If offsetFromTop is provided, use it
  if (fieldConfig.offsetFromTop !== null && fieldConfig.offsetFromTop !== undefined) {
    return pageHeight - fieldConfig.offsetFromTop;
  }
  // If y is provided directly, use it
  if (fieldConfig.y !== null && fieldConfig.y !== undefined) {
    return fieldConfig.y;
  }
  // Fallback: throw error if neither is provided
  throw new Error(`Field configuration missing both offsetFromTop and y values: ${JSON.stringify(fieldConfig)}`);
};

/**
 * Transliterate Cyrillic characters to Latin equivalents (fallback function)
 * Uses the transliteration package for better coverage
 * @param {string} text - Text that may contain Cyrillic characters
 * @returns {string} Transliterated text
 */
const transliterateCyrillic = (text) => {
  if (!text) return text;
  try {
    // Use transliteration package for better coverage
    return transliteration.transliterate(text, { unknown: '?' });
  } catch (error) {
    // Fallback to manual mapping if package fails
    const cyrillicMap = {
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh',
      'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
      'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
      'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y',
      'Ю': 'Yu', 'Я': 'Ya',
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
      'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
      'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y',
      'ю': 'yu', 'я': 'ya',
      'Ё': 'Yo', 'ё': 'yo', 'Є': 'Ye', 'є': 'ye', 'Ї': 'Yi', 'ї': 'yi',
      'І': 'I', 'і': 'i', 'Ґ': 'G', 'ґ': 'g'
    };
    return text.split('').map(char => cyrillicMap[char] || char).join('');
  }
};

/**
 * Try to load a Cyrillic-supporting font from various locations
 * @param {PDFDocument} pdfDoc - The PDF document
 * @returns {Promise<PDFFont|null>} The embedded font or null if not found
 */
const loadCyrillicFont = async (pdfDoc) => {
  // Resolve paths relative to __dirname (backend/services)
  const fontsDir = path.resolve(__dirname, '..', 'fonts');
  
  const fontPaths = [
    // Check fonts directory in backend (most reliable) - use absolute paths
    path.resolve(fontsDir, 'arial.ttf'),
    path.resolve(fontsDir, 'Arial.ttf'),
    path.resolve(fontsDir, 'dejavu-sans.ttf'),
    path.resolve(fontsDir, 'DejaVuSans.ttf'),
    path.resolve(fontsDir, 'LiberationSans-Regular.ttf'),
    // Windows system fonts (Arial supports Cyrillic)
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\Arial.ttf',
    'C:\\Windows\\Fonts\\ARIAL.TTF',
    // Alternative Windows paths
    'C:\\Windows\\Fonts\\times.ttf',
    'C:\\Windows\\Fonts\\TIMES.TTF',
  ];

  console.log(`[DEBUG] Attempting to load Cyrillic font...`);
  console.log(`[DEBUG] __dirname: ${__dirname}`);
  console.log(`[DEBUG] Fonts directory: ${fontsDir}`);
  console.log(`[DEBUG] Checking if fonts directory exists: ${fs.existsSync(fontsDir)}`);
  
  if (fs.existsSync(fontsDir)) {
    const files = fs.readdirSync(fontsDir);
    console.log(`[DEBUG] Files in fonts directory: ${files.join(', ')}`);
  }

  for (const fontPath of fontPaths) {
    try {
      // For relative paths, resolve them; for absolute paths, use as-is
      const resolvedPath = path.isAbsolute(fontPath) ? fontPath : path.resolve(fontPath);
      console.log(`[DEBUG] Checking font path: ${resolvedPath}`);
      console.log(`[DEBUG] Path exists: ${fs.existsSync(resolvedPath)}`);
      
      if (fs.existsSync(resolvedPath)) {
        const stats = fs.statSync(resolvedPath);
        console.log(`[DEBUG] ✓ Font file found: ${resolvedPath} (${stats.size} bytes)`);
        
        console.log(`[DEBUG] Reading font bytes...`);
        const fontBytes = fs.readFileSync(resolvedPath);
        console.log(`[DEBUG] Font bytes read: ${fontBytes.length} bytes`);
        
        console.log(`[DEBUG] Embedding font in PDF...`);
        const font = await pdfDoc.embedFont(fontBytes);
        console.log(`[DEBUG] ✓ Successfully loaded and embedded Cyrillic font from: ${resolvedPath}`);
        return font;
      } else {
        console.log(`[DEBUG] ✗ Font not found at: ${resolvedPath}`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to load font from ${fontPath}: ${error.message}`);
      console.error(`[ERROR] Error stack: ${error.stack}`);
      continue;
    }
  }

  console.warn(`[WARN] No Cyrillic font found after checking ${fontPaths.length} locations. Cyrillic text will be transliterated.`);
  console.warn(`[WARN] To enable Cyrillic support, place a font file (e.g., arial.ttf) in backend/fonts/`);
  return null;
};

/**
 * Generate travel order PDF using the original template file
 * @param {string} travelRequestId - Travel request UUID
 * @param {string} orderNumber - Unique order number
 * @returns {Promise<string>} Path to generated PDF file
 */
export const generateTravelOrderPDF = async (travelRequestId, orderNumber) => {
  try {
    // Fetch travel request details with related data
    const result = await pool.query(
      `SELECT 
        tr.id,
        tr.location_country,
        tr.location_city,
        tr.start_date,
        tr.end_date,
        tr.daily_allowance,
        tr.notes,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        u.email as requester_email,
        p.name as project_name,
        p.project_id,
        approver.first_name as approver_first_name,
        approver.last_name as approver_last_name,
        t_order.id as order_id,
        t_order.order_number,
        t_order.approval_date
      FROM travel_orders t_order
      JOIN travel_requests tr ON t_order.travel_request_id = tr.id
      JOIN users u ON tr.user_id = u.id
      JOIN projects p ON tr.project_id = p.id
      JOIN users approver ON t_order.approved_by_id = approver.id
      WHERE t_order.travel_request_id = ? AND t_order.order_number = ?`,
      [travelRequestId, orderNumber]
    );

    if (result.rows.length === 0) {
      throw new Error('Travel request or order not found');
    }

    const data = result.rows[0];

    // Calculate total days
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const totalAllowance = parseFloat(data.daily_allowance) * totalDays;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads', 'travel-orders');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`[DEBUG] Created upload directory: ${uploadDir}`);
      } else {
        console.log(`[DEBUG] Upload directory exists: ${uploadDir}`);
      }
    } catch (dirError) {
      console.error(`[ERROR] Failed to create upload directory: ${dirError.message}`);
      throw new Error(`Failed to create upload directory: ${dirError.message}`);
    }

    // Path to template PDF
    const templatePath = path.join(__dirname, '..', 'templates', 'Order.pdf');
    console.log(`[DEBUG] Looking for template PDF at: ${templatePath}`);
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      const errorMsg = `Template PDF not found at ${templatePath}. Please place Order.pdf in the backend/templates/ directory.`;
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    console.log(`[DEBUG] Template PDF found, proceeding with PDF generation...`);

    // Load the template PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Register fontkit to enable custom font embedding (required for Cyrillic fonts)
    pdfDoc.registerFontkit(fontkit);
    console.log(`[DEBUG] Fontkit registered for custom font support`);

    // Get form fields if the PDF has them
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Format dates as YYYY.MM.DD
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    const startDateFormatted = formatDate(data.start_date);
    const endDateFormatted = formatDate(data.end_date);
    const approvalDateFormatted = formatDate(data.approval_date);

    // Use original data without transliteration (keep original language)
    const employeeName = `${data.requester_first_name} ${data.requester_last_name}`;
    const approverName = `${data.approver_first_name} ${data.approver_last_name}`;
    const projectName = data.project_name;
    const taskText = data.notes || `${projectName} - ${data.project_id}`;
    const locationCity = data.location_city;
    // Country field removed - not shown on PDF

    // Try to fill form fields if they exist
    if (fields.length > 0) {
      try {
        // Get all field names for debugging
        console.log('[DEBUG] Available PDF form fields:', fields.map(f => f.getName()));
        
        // Map Bulgarian field names to values
        // Format: "за срок от      дни  от           до" - needs days, start date, end date
        const periodText = `${totalDays} дни от ${startDateFormatted} до ${endDateFormatted}`;
        
        // Common field names (English and Bulgarian)
        const fieldMap = {
          // English field names
          'order_number': `N ${data.order_number}`,
          'order_date': approvalDateFormatted,
          'employee_name': employeeName,
          'destination': locationCity,
          'start_date': startDateFormatted,
          'end_date': endDateFormatted,
          'total_days': String(totalDays),
          'task': taskText,
          'daily_allowance': parseFloat(data.daily_allowance).toFixed(2),
          'total_allowance': totalAllowance.toFixed(2),
          'approver_name': approverName,
          'approval_date': approvalDateFormatted,
          // Bulgarian field names (transliterated for matching)
          'до гр': locationCity, // "До гр.(с.)"
          'до град': locationCity,
          'град': locationCity,
          // Country field removed - not shown on PDF
          'със задача': taskText, // "със задача" (with task/notes)
          'задача': taskText,
          'notes': taskText,
          'за срок': periodText, // "за срок от      дни  от           до"
          'срок': periodText,
          'дни': String(totalDays),
          'дневни пари': parseFloat(data.daily_allowance).toFixed(2), // "Дневни пари по"
          'дневни': parseFloat(data.daily_allowance).toFixed(2),
        };

        // Try to fill fields by name (case-insensitive, handle Cyrillic)
        fields.forEach(field => {
          const fieldName = field.getName();
          const fieldNameLower = transliterateCyrillic(fieldName).toLowerCase();
          const fieldType = field.constructor.name;
          
          console.log(`[DEBUG] Processing field: "${fieldName}" (type: ${fieldType})`);
          
          // Try exact matches first (for specific Bulgarian fields)
          let matched = false;
          let valueToSet = null;
          
          // Check for specific Bulgarian field patterns - be more flexible
          // City field: "До гр.(с.)" or variations
          if (fieldNameLower.includes('до гр') || fieldNameLower.includes('до град') || 
              (fieldNameLower.includes('град') && !fieldNameLower.includes('държава')) ||
              fieldNameLower.includes('city') || fieldNameLower.includes('location_city')) {
            valueToSet = locationCity;
            console.log(`[DEBUG] Matched city field: "${fieldName}"`);
          }
          // Country field removed - not shown on PDF
          // Task/Notes field: "със задача" or variations
          else if (fieldNameLower.includes('със задача') || fieldNameLower.includes('задача') ||
                   fieldNameLower.includes('task') || fieldNameLower.includes('notes')) {
            valueToSet = taskText;
            console.log(`[DEBUG] Matched task field: "${fieldName}"`);
          }
          // Period field: "за срок от      дни  от           до" or variations
          else if (fieldNameLower.includes('за срок') || fieldNameLower.includes('срок') ||
                   fieldNameLower.includes('period') || fieldNameLower.includes('дни от')) {
            valueToSet = periodText;
            console.log(`[DEBUG] Matched period field: "${fieldName}"`);
          }
          // Daily allowance field: "Дневни пари по" or variations
          else if (fieldNameLower.includes('дневни пари') || fieldNameLower.includes('дневни') ||
                   fieldNameLower.includes('daily') || fieldNameLower.includes('allowance')) {
            valueToSet = parseFloat(data.daily_allowance).toFixed(2);
            console.log(`[DEBUG] Matched daily allowance field: "${fieldName}"`);
          }
          
          // If matched by specific pattern, try to set the value
          if (valueToSet !== null) {
            try {
              if (fieldType === 'PDFTextField') {
                field.setText(valueToSet);
                console.log(`[DEBUG] ✓ Successfully filled field "${fieldName}" with: ${valueToSet}`);
                matched = true;
              } else {
                console.log(`[DEBUG] Field "${fieldName}" is not a PDFTextField (type: ${fieldType}), skipping`);
              }
            } catch (e) {
              console.log(`[DEBUG] ✗ Error filling field "${fieldName}": ${e.message}`);
            }
          }
          
          // If not matched by specific patterns, try generic matching
          if (!matched) {
            for (const [key, value] of Object.entries(fieldMap)) {
              const keyLower = transliterateCyrillic(key).toLowerCase();
              // More flexible matching - check if field name contains the key or vice versa
              if (fieldNameLower.includes(keyLower) || keyLower.includes(fieldNameLower) || 
                  fieldNameLower === keyLower) {
                try {
                  if (fieldType === 'PDFTextField') {
                    field.setText(value);
                    console.log(`[DEBUG] ✓ Filled field "${fieldName}" (matched key "${key}") with: ${value}`);
                    matched = true;
                    break;
                  } else {
                    console.log(`[DEBUG] Field "${fieldName}" (matched "${key}") is not a PDFTextField, skipping`);
                  }
                } catch (e) {
                  console.log(`[DEBUG] ✗ Error filling field "${fieldName}" with key "${key}": ${e.message}`);
                }
              }
            }
          }
          
          if (!matched) {
            console.log(`[DEBUG] ⚠ Field "${fieldName}" was not matched to any data`);
          }
        });
      } catch (e) {
        console.log('Could not fill form fields, using text overlay instead:', e.message);
      }
    }

    // If no form fields or form filling failed, use text overlay
    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Register standard fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Try to load a Cyrillic-supporting font
    console.log(`[DEBUG] ===== Loading Cyrillic Font =====`);
    const cyrillicFont = await loadCyrillicFont(pdfDoc);
    if (cyrillicFont) {
      console.log(`[DEBUG] ✓ Cyrillic font is available and ready to use`);
      // Test if the font can render Cyrillic characters
      try {
        const testText = 'Тест';
        const testWidth = cyrillicFont.widthOfTextAtSize(testText, 12);
        console.log(`[DEBUG] ✓ Font test successful - can render Cyrillic: "${testText}" (width: ${testWidth})`);
      } catch (testError) {
        console.warn(`[WARN] Font test failed: ${testError.message}`);
      }
    } else {
      console.log(`[DEBUG] ✗ Cyrillic font is NOT available - text will be transliterated`);
    }
    console.log(`[DEBUG] ==================================`);
    
    // Helper function to safely draw text with automatic Cyrillic handling
    // Uses Cyrillic font if available, otherwise transliterates
    const safeDrawText = (page, text, options) => {
      if (!text) return; // Skip if text is empty/null
      
      // Convert to string if not already
      const textStr = String(text);
      
      // Check if text contains Cyrillic characters
      const hasCyrillic = /[\u0400-\u04FF]/.test(textStr);
      
      // If we have a Cyrillic font and the text contains Cyrillic, use the Cyrillic font
      if (hasCyrillic) {
        if (cyrillicFont) {
          // Use Cyrillic font to display original text
          try {
            console.log(`[DEBUG] ✓ Drawing Cyrillic text with custom font: "${textStr.substring(0, 50)}${textStr.length > 50 ? '...' : ''}"`);
            // Create new options object with Cyrillic font, preserving other options
            const cyrillicOptions = {
              ...options,
              font: cyrillicFont, // Override font with Cyrillic-supporting font
            };
            page.drawText(textStr, cyrillicOptions);
            return; // Successfully drawn with Cyrillic font
          } catch (error) {
            console.error(`[ERROR] Failed to draw with Cyrillic font: ${error.message}`);
            console.error(`[ERROR] Error stack: ${error.stack}`);
            console.warn(`[WARN] Falling back to transliteration due to error`);
            // Fall through to transliteration fallback
          }
        } else {
          console.warn(`[WARN] Cyrillic text detected but no Cyrillic font available. Text: "${textStr.substring(0, 30)}${textStr.length > 30 ? '...' : ''}"`);
        }
      }
      
      // No Cyrillic font available or error occurred - transliterate if needed
      if (hasCyrillic) {
        const textToDraw = transliterateCyrillic(textStr);
        console.warn(`[WARN] Transliterating Cyrillic text: "${textStr.substring(0, 30)}${textStr.length > 30 ? '...' : ''}" -> "${textToDraw.substring(0, 30)}${textToDraw.length > 30 ? '...' : ''}"`);
        
        // Draw the transliterated text with original font options
        try {
          page.drawText(textToDraw, options);
        } catch (error) {
          // If there's still an encoding error, try transliterating again as a last resort
          if (error.message && error.message.includes('WinAnsi cannot encode')) {
            console.warn(`[WARN] Unexpected encoding error even after transliteration, retrying...`);
            const retryText = transliterateCyrillic(textStr);
            page.drawText(retryText, options);
          } else {
            // Different error, re-throw
            throw error;
          }
        }
      } else {
        // No Cyrillic characters, draw normally
        try {
          page.drawText(textStr, options);
        } catch (error) {
          // If there's an encoding error with non-Cyrillic text, try transliterating as fallback
          if (error.message && error.message.includes('WinAnsi cannot encode')) {
            console.warn(`[WARN] Encoding error with non-Cyrillic text, trying transliteration...`);
            const transliterated = transliterateCyrillic(textStr);
            page.drawText(transliterated, options);
          } else {
            throw error;
          }
        }
      }
    };

    // Fill text at specific coordinates (adjust these based on your template)
    // These coordinates are for landscape A4 (842 x 595 points)
    // You may need to adjust these based on your actual template layout

    // Order number (top right area)
    firstPage.drawText(`N ${data.order_number}`, {
      x: FIELD_COORDINATES.orderNumber.x,
      y: getYCoordinate(FIELD_COORDINATES.orderNumber, height),
      size: FIELD_COORDINATES.orderNumber.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Order date (top right)
    firstPage.drawText(approvalDateFormatted, {
      x: FIELD_COORDINATES.orderDate.x,
      y: getYCoordinate(FIELD_COORDINATES.orderDate, height),
      size: FIELD_COORDINATES.orderDate.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Requester name at additional location (x: 480, y: 465)
    safeDrawText(firstPage, employeeName, {
      x: 480,
      y: 465,
      size: FIELD_COORDINATES.employeeName.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Employee name (after "Имена на командирования")
    safeDrawText(firstPage, employeeName, {
      x: FIELD_COORDINATES.employeeName.x,
      y: getYCoordinate(FIELD_COORDINATES.employeeName, height),
      size: FIELD_COORDINATES.employeeName.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // City field: "До гр.(с.)"
    safeDrawText(firstPage, locationCity, {
      x: FIELD_COORDINATES.city.x,
      y: getYCoordinate(FIELD_COORDINATES.city, height),
      size: FIELD_COORDINATES.city.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Country field removed - not displayed on PDF

    // Period field: "за срок от      дни  от           до"
    // Draw days, start date, and end date
    // Use individual y coordinates if specified, otherwise use period's y
    const periodY = getYCoordinate(FIELD_COORDINATES.period, height);
    const periodDaysY = FIELD_COORDINATES.periodDays.y !== null && FIELD_COORDINATES.periodDays.y !== undefined 
      ? FIELD_COORDINATES.periodDays.y 
      : periodY;
    const periodStartY = FIELD_COORDINATES.periodStartDate.y !== null && FIELD_COORDINATES.periodStartDate.y !== undefined 
      ? FIELD_COORDINATES.periodStartDate.y 
      : periodY;
    const periodEndY = FIELD_COORDINATES.periodEndDate.y !== null && FIELD_COORDINATES.periodEndDate.y !== undefined 
      ? FIELD_COORDINATES.periodEndDate.y 
      : periodY;
    
    // Days
    firstPage.drawText(String(totalDays), {
      x: FIELD_COORDINATES.periodDays.x,
      y: periodDaysY,
      size: FIELD_COORDINATES.periodDays.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Start date
    firstPage.drawText(startDateFormatted, {
      x: FIELD_COORDINATES.periodStartDate.x,
      y: periodStartY,
      size: FIELD_COORDINATES.periodStartDate.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // End date
    firstPage.drawText(endDateFormatted, {
      x: FIELD_COORDINATES.periodEndDate.x,
      y: periodEndY,
      size: FIELD_COORDINATES.periodEndDate.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Task/Notes field: "със задача"
    safeDrawText(firstPage, taskText.substring(0, 50), {
      x: FIELD_COORDINATES.task.x,
      y: getYCoordinate(FIELD_COORDINATES.task, height),
      size: FIELD_COORDINATES.task.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Daily allowance field: "Дневни пари по"
    firstPage.drawText(`${parseFloat(data.daily_allowance).toFixed(2)}`, {
      x: FIELD_COORDINATES.dailyAllowance.x,
      y: getYCoordinate(FIELD_COORDINATES.dailyAllowance, height),
      size: FIELD_COORDINATES.dailyAllowance.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Expense table section - Row 1 (outbound)
    safeDrawText(firstPage, startDateFormatted, {
      x: FIELD_COORDINATES.expenseOutboundDate.x,
      y: getYCoordinate(FIELD_COORDINATES.expenseOutboundDate, height),
      size: FIELD_COORDINATES.expenseOutboundDate.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    safeDrawText(firstPage, `София-${locationCity}`, {
      x: FIELD_COORDINATES.expenseOutboundRoute.x,
      y: getYCoordinate(FIELD_COORDINATES.expenseOutboundRoute, height),
      size: FIELD_COORDINATES.expenseOutboundRoute.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Row 2 (return)
    safeDrawText(firstPage, endDateFormatted, {
      x: FIELD_COORDINATES.expenseReturnDate.x,
      y: getYCoordinate(FIELD_COORDINATES.expenseReturnDate, height),
      size: FIELD_COORDINATES.expenseReturnDate.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    safeDrawText(firstPage, `${locationCity}-София`, {
      x: FIELD_COORDINATES.expenseReturnRoute.x,
      y: getYCoordinate(FIELD_COORDINATES.expenseReturnRoute, height),
      size: FIELD_COORDINATES.expenseReturnRoute.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Daily allowance calculation
    firstPage.drawText(String(totalDays), {
      x: FIELD_COORDINATES.calcTotalDays.x,
      y: getYCoordinate(FIELD_COORDINATES.calcTotalDays, height),
      size: FIELD_COORDINATES.calcTotalDays.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(`${parseFloat(data.daily_allowance).toFixed(2)}`, {
      x: FIELD_COORDINATES.calcDailyAllowance.x,
      y: getYCoordinate(FIELD_COORDINATES.calcDailyAllowance, height),
      size: FIELD_COORDINATES.calcDailyAllowance.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    firstPage.drawText(`${totalAllowance.toFixed(2)}`, {
      x: FIELD_COORDINATES.calcTotalAllowance.x,
      y: getYCoordinate(FIELD_COORDINATES.calcTotalAllowance, height),
      size: FIELD_COORDINATES.calcTotalAllowance.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Total amount
    firstPage.drawText(`${totalAllowance.toFixed(2)}`, {
      x: FIELD_COORDINATES.totalAmount.x,
      y: getYCoordinate(FIELD_COORDINATES.totalAmount, height),
      size: FIELD_COORDINATES.totalAmount.size,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    // Approver name
    safeDrawText(firstPage, approverName, {
      x: FIELD_COORDINATES.approverName.x,
      y: getYCoordinate(FIELD_COORDINATES.approverName, height),
      size: FIELD_COORDINATES.approverName.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Approval date (bottom section)
    firstPage.drawText(approvalDateFormatted, {
      x: FIELD_COORDINATES.approvalDate.x,
      y: getYCoordinate(FIELD_COORDINATES.approvalDate, height),
      size: FIELD_COORDINATES.approvalDate.size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Generate output filename
    const fileName = `${orderNumber.replace(/-/g, '_')}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure we use absolute path
    const absoluteFilePath = path.resolve(filePath);
    console.log(`[DEBUG] Writing PDF to: ${absoluteFilePath}`);

    // Write the PDF to file
    try {
      fs.writeFileSync(absoluteFilePath, pdfBytes);
      console.log(`[DEBUG] PDF file write operation completed`);
    } catch (writeError) {
      console.error(`[ERROR] Failed to write PDF file: ${writeError.message}`);
      throw new Error(`Failed to write PDF file: ${writeError.message}`);
    }
    
    // Verify file was written
    if (!fs.existsSync(absoluteFilePath)) {
      throw new Error(`PDF file was not created at ${absoluteFilePath}`);
    }
    
    const stats = fs.statSync(absoluteFilePath);
    if (stats.size === 0) {
      throw new Error(`PDF file was created but is empty at ${absoluteFilePath}`);
    }
    
    console.log(`[DEBUG] PDF file written successfully: ${absoluteFilePath}, Size: ${stats.size} bytes`);

    // Update travel order with PDF path (store absolute path)
    // Use order_id as primary key for more reliable update
    const orderId = data.order_id;
    let updateResult = await pool.query(
      'UPDATE travel_orders SET pdf_path = ? WHERE id = ?',
      [absoluteFilePath, orderId]
    );
    
    // If update by ID failed, try by travel_request_id and order_number as fallback
    if (updateResult.rowCount === 0) {
      console.warn(`[WARN] Update by order_id failed, trying fallback method...`);
      updateResult = await pool.query(
        'UPDATE travel_orders SET pdf_path = ? WHERE travel_request_id = ? AND order_number = ?',
        [absoluteFilePath, travelRequestId, orderNumber]
      );
    }
    
    // Verify the update was successful
    if (updateResult.rowCount === 0) {
      console.error(`[ERROR] Failed to update PDF path in database. No rows updated for order_id: ${orderId}, travel_request_id: ${travelRequestId}, order_number: ${orderNumber}`);
      throw new Error(`Failed to update PDF path in database for order ${orderNumber}`);
    }
    
    console.log(`[DEBUG] PDF path stored in database: ${absoluteFilePath} (${updateResult.rowCount} row(s) updated)`);
    
    // Double-check the path was saved correctly using order_id (most reliable)
    const verifyResult = await pool.query(
      'SELECT pdf_path FROM travel_orders WHERE id = ?',
      [orderId]
    );
    
    if (verifyResult.rows.length === 0) {
      console.error(`[ERROR] Order not found during verification: ${orderId}`);
      throw new Error(`Order not found during PDF path verification`);
    }
    
    const savedPath = verifyResult.rows[0].pdf_path;
    if (savedPath !== absoluteFilePath) {
      console.error(`[ERROR] PDF path verification failed. Expected: ${absoluteFilePath}, Got: ${savedPath || 'null'}`);
      throw new Error(`PDF path was not saved correctly in database`);
    }
    
    console.log(`[DEBUG] PDF path verified in database: ${savedPath}`);

    return absoluteFilePath;
  } catch (error) {
    console.error('[ERROR] Error generating PDF:', error.message);
    console.error('[ERROR] Error stack:', error.stack);
    console.error('[ERROR] Full error object:', error);
    
    // If it's an encoding error with Cyrillic, provide helpful message
    if (error.message && error.message.includes('WinAnsi cannot encode')) {
      const charMatch = error.message.match(/cannot encode "([^"]+)"/);
      if (charMatch) {
        console.error(`[ERROR] Cyrillic character encoding issue: "${charMatch[1]}"`);
        console.error('[ERROR] Suggestion: The standard PDF fonts do not support Cyrillic characters.');
        console.error('[ERROR] Options: 1) Use transliteration, or 2) Add a custom Cyrillic font');
      }
    }
    
    throw error;
  }
};
