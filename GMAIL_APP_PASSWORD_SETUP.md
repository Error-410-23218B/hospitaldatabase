# How to Generate a Gmail App Password for Nodemailer

Since your Gmail account has 2-factor authentication (2FA) enabled, you cannot use your regular Gmail password for SMTP authentication. Instead, you need to generate an App Password specifically for Nodemailer.

## Steps to Generate a Gmail App Password

1. Go to your Google Account Security page: https://myaccount.google.com/security

2. Under the "Signing in to Google" section, find and click on **App Passwords**.
   - If you do not see this option, ensure that 2-Step Verification is enabled on your account.

3. You may be prompted to sign in again for security.

4. In the "Select app" dropdown, choose **Other (Custom name)**.

5. Enter a name like "Nodemailer SMTP" and click **Generate**.

6. Google will display a 16-character app password. Copy this password.

7. Update your `.env` file in your project root with the following:

```
GMAIL_EMAIL=your_gmail_email@example.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

8. Save the `.env` file and restart your development server to apply the changes.

## Important Notes

- Keep your app password secure and do not share it.
- If you ever revoke the app password, you will need to generate a new one and update your `.env` file.
- Using app passwords is more secure than enabling "Less secure app access".

If you need help updating your `.env` file or testing the contact form email sending after this, please let me know.
