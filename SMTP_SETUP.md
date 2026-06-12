# SMTP Email Configuration Guide

This guide explains how to configure SMTP settings to enable email notifications in the Business Travel Order Management System.

## Email Features

The system sends emails for:
1. **Travel Request Notifications** - Sent to the responsible user when a new travel request is submitted
2. **Travel Order Approvals** - Sent to the requester when their travel request is approved (includes PDF attachment)
3. **Password Reset** - Sent when a user requests a password reset

## Configuration Steps

### 1. Edit the `.env` file

Navigate to the `backend` directory and edit the `.env` file. Add or update the following SMTP settings:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

### 2. Choose Your Email Provider

#### Option A: Gmail

**Settings:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Important:** Gmail requires an **App Password**, not your regular password.

**Steps to get Gmail App Password:**
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable it if not already enabled)
3. Go to **Security** → **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Enter "BTRIP Application" as the name
6. Click **Generate**
7. Copy the 16-character password and use it as `SMTP_PASSWORD`

#### Option B: Outlook/Office 365

**Settings:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM=your-email@outlook.com
```

**Note:** For Office 365, you may need to enable "Less secure app access" or use an App Password.

#### Option C: Custom SMTP Server

**Settings:**
```env
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_USER=your-email@yourcompany.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourcompany.com
```

**Common SMTP Ports:**
- `587` - TLS/STARTTLS (recommended)
- `465` - SSL/TLS
- `25` - Usually blocked by ISPs

### 3. Verify Configuration

After updating the `.env` file, restart your backend server. The server will automatically verify the SMTP configuration on startup.

**Check the console output:**
- ✅ `SMTP server is ready to send emails` - Configuration is correct
- ❌ `SMTP configuration error:` - Check your settings

### 4. Test Email Sending

1. Create a travel request in the system
2. Check the backend console for email sending logs
3. Check the responsible user's email inbox

## Troubleshooting

### Error: "Invalid login"
- **Gmail:** Make sure you're using an App Password, not your regular password
- **Other providers:** Verify your username and password are correct

### Error: "Connection timeout"
- Check if your firewall/network allows SMTP connections
- Verify the SMTP_HOST and SMTP_PORT are correct
- Try port 465 with `secure: true` if 587 doesn't work

### Error: "Authentication failed"
- Ensure 2-factor authentication is enabled (for Gmail)
- Use App Password instead of regular password
- Check if "Less secure app access" needs to be enabled

### Emails not being sent
- Check backend console for error messages
- Verify SMTP settings in `.env` file
- Ensure the backend server was restarted after changing `.env`
- Check spam/junk folder

### Gmail-specific Issues

If using Gmail and experiencing issues:

1. **Enable 2-Step Verification** (required for App Passwords)
2. **Generate App Password** (16 characters, no spaces)
3. **Use App Password** as `SMTP_PASSWORD`
4. **Don't use** your regular Gmail password

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use App Passwords** instead of regular passwords when possible
3. **Restrict SMTP access** to specific IPs if your provider supports it
4. **Use environment-specific** SMTP settings (development vs production)

## Example .env Configuration

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Database Configuration (SQLite)
# DB_PATH is optional - defaults to ../../database/btrip.db

# Frontend URL
FRONTEND_URL=http://localhost:5173

# SMTP Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM=noreply@yourcompany.com
```

## Testing Email Configuration

You can test your SMTP configuration by:

1. **Creating a travel request** - This will send an email to the responsible user
2. **Requesting a password reset** - This will send a reset email
3. **Approving a travel request** - This will send an approval email with PDF

All email sending attempts are logged in the backend console, so check there for any errors.



