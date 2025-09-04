# Contact Form Setup

This application includes a contact form that allows visitors to send emails directly through the website. The form uses EmailJS for client-side email sending, which is perfect for static sites deployed to GitHub Pages.

## Setting up EmailJS

To enable the contact form email functionality, you need to set up EmailJS:

### 1. Create an EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create an Email Service
1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down the **Service ID**

### 3. Create an Email Template
1. Go to "Email Templates" in your dashboard
2. Click "Create New Template"
3. Use these template variables in your email template:
   - `{{from_name}}` - Sender's name
   - `{{from_email}}` - Sender's email
   - `{{subject}}` - Email subject
   - `{{message}}` - Email message content
   - `{{to_email}}` - Your email address (where you want to receive messages)

Example template:
```
Subject: {{subject}}

You have received a new message from your website contact form.

From: {{from_name}} ({{from_email}})
Subject: {{subject}}

Message:
{{message}}

---
This message was sent from your portfolio website contact form.
```

4. Note down the **Template ID**

### 4. Get Your Public Key
1. Go to "Account" in your EmailJS dashboard
2. Find your **Public Key** (also called User ID)

### 5. Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your EmailJS credentials:
   ```
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
   ```

### 6. Restart the Development Server
```bash
npm run dev
```

## Features

The contact form includes:
- ✅ Form validation for all required fields
- ✅ Email format validation
- ✅ Success/error feedback messages
- ✅ Responsive design that matches the site theme
- ✅ Dark mode support
- ✅ Accessible form labels and error messages

## Deployment Notes

When deploying to GitHub Pages or other static hosting:
1. Make sure your environment variables are properly configured in your deployment environment
2. For GitHub Pages, you can use GitHub Secrets and GitHub Actions to set environment variables during build
3. The EmailJS integration works entirely client-side, so no server setup is required

## Security

- Environment variables starting with `NEXT_PUBLIC_` are safe to expose to the client
- EmailJS handles the actual email sending securely
- No sensitive server credentials are needed
- The form includes basic spam protection through client-side validation

## Troubleshooting

If emails aren't sending:
1. Check browser console for error messages
2. Verify all EmailJS credentials are correct
3. Ensure your EmailJS service is properly configured
4. Check your email provider's settings (Gmail might need app passwords)
5. Verify your EmailJS account is still active and within usage limits