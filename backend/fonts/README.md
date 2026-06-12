# Cyrillic Font Setup

This directory is for storing fonts that support Cyrillic characters for PDF generation.

## How to Add a Cyrillic Font

To display Cyrillic characters in their original language (instead of transliterating them), place a Cyrillic-supporting font file in this directory.

### Option 1: Use Windows System Font (Recommended)

If you're on Windows, you can copy Arial (which supports Cyrillic) from your system fonts:

1. Navigate to `C:\Windows\Fonts\`
2. Copy `arial.ttf` or `Arial.ttf` to this directory (`backend/fonts/`)
3. Rename it to `arial.ttf` (lowercase) if needed

### Option 2: Download a Free Cyrillic Font

You can download free fonts that support Cyrillic:

- **DejaVu Sans**: https://dejavu-fonts.github.io/
- **Liberation Sans**: https://github.com/liberationfonts/liberation-fonts
- **Noto Sans**: https://fonts.google.com/noto/specimen/Noto+Sans

1. Download the font file (`.ttf` format)
2. Place it in this directory (`backend/fonts/`)
3. Name it `arial.ttf`, `DejaVuSans.ttf`, or `LiberationSans-Regular.ttf`

### Supported Font Names

The system will automatically look for these font files (in order):
- `backend/fonts/arial.ttf`
- `backend/fonts/Arial.ttf`
- `backend/fonts/DejaVuSans.ttf`
- `backend/fonts/LiberationSans-Regular.ttf`
- Windows system fonts (if available)

### Verification

After adding a font, restart your backend server. When generating a PDF with Cyrillic text, you should see:
- `[DEBUG] Loading Cyrillic font from: ...` in the logs
- `[DEBUG] Successfully loaded Cyrillic font`
- Cyrillic text displayed in its original form in the PDF

If no font is found, Cyrillic text will be automatically transliterated to Latin characters (e.g., "София" → "Sofia").

