import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupSMTP() {
  console.log('\n=== SMTP Configuration Setup ===\n');
  
  console.log('Choose your email provider:');
  console.log('1. Gmail');
  console.log('2. Outlook/Office 365');
  console.log('3. Custom SMTP Server');
  console.log('4. Skip (configure manually)\n');
  
  const choice = await question('Enter your choice (1-4): ');
  
  let smtpConfig = {};
  
  if (choice === '1') {
    // Gmail
    smtpConfig = {
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
    };
    console.log('\n--- Gmail Configuration ---');
    console.log('Note: You need to use an App Password, not your regular Gmail password.');
    console.log('Get your App Password from: https://myaccount.google.com/apppasswords\n');
    smtpConfig.SMTP_USER = await question('Enter your Gmail address: ');
    smtpConfig.SMTP_PASSWORD = await question('Enter your Gmail App Password (16 characters): ');
    smtpConfig.SMTP_FROM = await question('Enter sender email (or press Enter to use your Gmail): ') || smtpConfig.SMTP_USER;
    
  } else if (choice === '2') {
    // Outlook
    smtpConfig = {
      SMTP_HOST: 'smtp.office365.com',
      SMTP_PORT: '587',
    };
    console.log('\n--- Outlook/Office 365 Configuration ---\n');
    smtpConfig.SMTP_USER = await question('Enter your Outlook email address: ');
    smtpConfig.SMTP_PASSWORD = await question('Enter your password: ');
    smtpConfig.SMTP_FROM = await question('Enter sender email (or press Enter to use your Outlook email): ') || smtpConfig.SMTP_USER;
    
  } else if (choice === '3') {
    // Custom
    console.log('\n--- Custom SMTP Configuration ---\n');
    smtpConfig.SMTP_HOST = await question('Enter SMTP host (e.g., mail.yourcompany.com): ');
    smtpConfig.SMTP_PORT = await question('Enter SMTP port (587 for TLS, 465 for SSL): ') || '587';
    smtpConfig.SMTP_USER = await question('Enter SMTP username/email: ');
    smtpConfig.SMTP_PASSWORD = await question('Enter SMTP password: ');
    smtpConfig.SMTP_FROM = await question('Enter sender email: ') || smtpConfig.SMTP_USER;
    
  } else {
    console.log('\nSkipping automated setup. Please configure SMTP manually in backend/.env');
    console.log('See SMTP_SETUP.md for detailed instructions.');
    rl.close();
    process.exit(0);
  }
  
  // Read existing .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove existing SMTP settings if present
  envContent = envContent.replace(/# SMTP Configuration.*?(?=\n\n|\n#|\n$)/gs, '');
  envContent = envContent.replace(/SMTP_HOST=.*/g, '');
  envContent = envContent.replace(/SMTP_PORT=.*/g, '');
  envContent = envContent.replace(/SMTP_USER=.*/g, '');
  envContent = envContent.replace(/SMTP_PASSWORD=.*/g, '');
  envContent = envContent.replace(/SMTP_FROM=.*/g, '');
  
  // Add new SMTP configuration
  const smtpSection = `
# SMTP Configuration for Email Notifications
SMTP_HOST=${smtpConfig.SMTP_HOST}
SMTP_PORT=${smtpConfig.SMTP_PORT}
SMTP_USER=${smtpConfig.SMTP_USER}
SMTP_PASSWORD=${smtpConfig.SMTP_PASSWORD}
SMTP_FROM=${smtpConfig.SMTP_FROM}
`;
  
  envContent += smtpSection;
  
  // Write back to .env file
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('\n✓ SMTP configuration saved to backend/.env');
  console.log('\nNext steps:');
  console.log('1. Restart your backend server');
  console.log('2. Check the console for "SMTP server is ready to send emails"');
  console.log('3. Create a travel request to test email notifications\n');
  
  rl.close();
  process.exit(0);
}

setupSMTP().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});



