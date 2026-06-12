import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Check if SMTP is configured
const isSMTPConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;

// Create transporter only if SMTP is configured
let transporter = null;

if (isSMTPConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP configuration error:', error.message);
      console.error('Please check your SMTP settings in .env file. See SMTP_SETUP.md for help.');
    } else {
      console.log('✓ SMTP server is ready to send emails');
    }
  });
} else {
  console.warn('⚠ SMTP not configured. Email notifications will be disabled.');
  console.warn('  To enable emails, configure SMTP settings in backend/.env');
  console.warn('  See SMTP_SETUP.md for detailed instructions');
}

/**
 * Send travel request notification to responsible user
 */
export const sendTravelRequestNotification = async (
  responsibleUserEmail,
  responsibleUserName,
  requesterName,
  projectName,
  location,
  startDate,
  endDate,
  requestId
) => {
  // Format dates in Bulgarian format (DD.MM.YYYY)
  const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: responsibleUserEmail,
    subject: `Нова заявка за командировка за проект: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Нова заявка за командировка</h2>
        <p>Здравейте ${responsibleUserName},</p>
        <p>Получена е нова заявка за командировка за проект, по който сте отговорен.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Детайли на заявката:</h3>
          <p><strong>Заявител:</strong> ${requesterName}</p>
          <p><strong>Проект:</strong> ${projectName}</p>
          <p><strong>Дестинация:</strong> ${location}</p>
          <p><strong>Начална дата:</strong> ${formatDate(startDate)}</p>
          <p><strong>Крайна дата:</strong> ${formatDate(endDate)}</p>
        </div>
        
        <p style="margin-top: 30px; font-weight: bold;">
          Моля, влезте в системата за да дадете становище.
        </p>
      </div>
    `,
  };

  if (!transporter) {
    console.warn('⚠ Email not sent: SMTP not configured');
    console.warn(`  Would have sent travel request notification to ${responsibleUserEmail}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Travel request notification sent to ${responsibleUserEmail}`);
  } catch (error) {
    console.error('✗ Error sending travel request notification:', error.message);
    throw error;
  }
};

/**
 * Send travel order approval email with PDF attachment
 */
export const sendTravelOrderApproval = async (
  requesterEmail,
  requesterName,
  orderNumber,
  pdfPath
) => {
  console.log(`[DEBUG] sendTravelOrderApproval called with email: ${requesterEmail}, name: ${requesterName}`);
  console.log(`[DEBUG] PDF path received: ${pdfPath}`);
  
  // If no PDF path provided, try to get it from database
  if (!pdfPath) {
    try {
      const orderResult = await pool.query(
        'SELECT pdf_path FROM travel_orders WHERE order_number = ?',
        [orderNumber]
      );
      if (orderResult.rows.length > 0 && orderResult.rows[0].pdf_path) {
        pdfPath = orderResult.rows[0].pdf_path;
        console.log(`[DEBUG] Retrieved PDF path from database: ${pdfPath}`);
      }
    } catch (dbError) {
      console.error(`[ERROR] Error retrieving PDF path from database: ${dbError.message}`);
    }
  }
  
  // Check if PDF file exists with retry mechanism
  let attachments = [];
  if (pdfPath) {
    // Convert to absolute path if relative
    const absolutePath = path.isAbsolute(pdfPath) ? pdfPath : path.resolve(pdfPath);
    console.log(`[DEBUG] Checking PDF at absolute path: ${absolutePath}`);
    
    // Try multiple path variations
    const pathsToTry = [
      absolutePath,
      pdfPath,
      path.resolve(process.cwd(), pdfPath),
      path.resolve(__dirname, '..', pdfPath),
    ];
    
    let foundPath = null;
    for (const testPath of pathsToTry) {
      try {
        if (fs.existsSync(testPath)) {
          const stats = fs.statSync(testPath);
          if (stats.size > 0) {
            console.log(`[DEBUG] PDF file found at: ${testPath}, Size: ${stats.size} bytes`);
            foundPath = testPath;
            break;
          } else {
            console.warn(`[DEBUG] PDF file exists but is empty: ${testPath}`);
          }
        }
      } catch (fsError) {
        // Continue to next path
        continue;
      }
    }
    
    if (foundPath) {
      attachments = [
        {
          filename: `${orderNumber.replace(/-/g, '_')}.pdf`,
          path: foundPath,
        },
      ];
      console.log(`[DEBUG] PDF attachment added: ${attachments[0].filename} from ${foundPath}`);
    } else {
      console.warn(`⚠ PDF file not found at any of these paths: ${pathsToTry.join(', ')}`);
    }
  } else {
    console.warn(`⚠ No PDF path provided`);
  }
  
  console.log(`[DEBUG] Email will be sent with ${attachments.length} attachment(s)`);
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: requesterEmail,
    subject: `Одобрена заявка за командировка: ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Заявка за командировка одобрена</h2>
        <p>Здравейте ${requesterName},</p>
        <p>Вашата заявка за командировка е одобрена!</p>
        <p><strong>Номер на заповед:</strong> ${orderNumber}</p>
        <p>Моля, намерете документа за командировката, прикачен към този имейл.</p>
        <p>Можете също да го изтеглите от вашия профил в системата.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Това е автоматично съобщение. Моля, не отговаряйте на този имейл.
        </p>
      </div>
    `,
    attachments: attachments,
  };

  if (!transporter) {
    console.warn('⚠ Email not sent: SMTP not configured');
    console.warn(`  Would have sent travel order approval to ${requesterEmail}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Travel order approval email sent to ${requesterEmail}`);
  } catch (error) {
    console.error('✗ Error sending travel order approval email:', error.message);
    throw error;
  }
};

/**
 * Send travel request rejection email
 */
export const sendTravelRequestRejection = async (
  requesterEmail,
  requesterName,
  projectName,
  rejectionReason
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: requesterEmail,
    subject: `Отхвърлена заявка за командировка за проект: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Заявка за командировка отхвърлена</h2>
        <p>Здравейте ${requesterName},</p>
        <p>Съжаляваме да Ви информираме, че вашата заявка за командировка за проект <strong>${projectName}</strong> е отхвърлена.</p>
        ${rejectionReason ? `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #dc3545;">Причина за отхвърляне:</h3>
          <p style="margin-bottom: 0;">${rejectionReason}</p>
        </div>
        ` : ''}
        <p>Моля, влезте в системата за повече информация или за да подадете нова заявка.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Това е автоматично съобщение. Моля, не отговаряйте на този имейл.
        </p>
      </div>
    `,
  };

  if (!transporter) {
    console.warn('⚠ Email not sent: SMTP not configured');
    console.warn(`  Would have sent travel request rejection to ${requesterEmail}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Travel request rejection email sent to ${requesterEmail}`);
  } catch (error) {
    console.error('✗ Error sending travel request rejection email:', error.message);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const internalUrl = process.env.FRONTEND_URL || 'http://200.200.200.231:5173';
  const externalUrl = process.env.FRONTEND_URL_EXTERNAL || 'http://46.10.201.238:5173';
  const resetLinkInternal = `${internalUrl}/reset-password?token=${resetToken}`;
  const resetLinkExternal = `${externalUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: userEmail,
    subject: 'Password Reset Request / Заявка за смяна на парола',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request / Заявка за смяна на парола</h2>
        <p>Hello ${userName},</p>
        <p>You have requested to reset your password. Click one of the links below to reset it:</p>
        <p>Вие заявихте смяна на паролата си. Кликнете на един от линковете по-долу:</p>
        
        <div style="margin: 30px 0;">
          <p>
            <a href="${resetLinkInternal}" 
               style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              RESET PASSWORD FROM OFFICE
            </a>
          </p>
          <p style="color: #666; font-size: 11px; margin-top: 5px;">
            (Use this link when connected to the office network / Използвайте този линк от офиса)
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <p>
            <a href="${resetLinkExternal}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              RESET PASSWORD FROM OUTSIDE
            </a>
          </p>
          <p style="color: #666; font-size: 11px; margin-top: 5px;">
            (Use this link when outside the office / Използвайте този линк извън офиса)
          </p>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          This link will expire in 1 hour.<br>
          If you didn't request this, please ignore this email.<br><br>
          Линкът ще изтече след 1 час.<br>
          Ако не сте заявили смяна на паролата, моля игнорирайте този имейл.
        </p>
      </div>
    `,
  };

  if (!transporter) {
    console.warn('⚠ Email not sent: SMTP not configured');
    console.warn(`  Would have sent password reset email to ${userEmail}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error('✗ Error sending password reset email:', error.message);
    throw error;
  }
};

