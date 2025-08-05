# User Registration System Setup Guide

This guide will help you set up the user registration system with Supabase database integration and email functionality.

## Features

- ✅ User registration form with validation
- ✅ Supabase database integration with `interested_users` table
- ✅ Automatic UPI QR code generation for ₹49 payment
- ✅ Email delivery with payment instructions using Nodemailer
- ✅ Row Level Security (RLS) policies
- ✅ Error handling for both database and email operations
- ✅ Responsive UI with loading states

## Prerequisites

1. **Supabase Project**: You need a Supabase project set up
2. **Gmail Account**: For sending emails via SMTP
3. **Gmail App Password**: For secure SMTP authentication

## Installation Steps

### 1. Dependencies

The required dependencies have been installed:
- `@supabase/supabase-js` - Supabase client
- `nodemailer` - Email sending
- `@types/nodemailer` - TypeScript types

### 2. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the content from supabase-migration.sql
-- This creates the interested_users table with RLS policies
```

Or run this file directly:
```bash
# In Supabase Dashboard > SQL Editor > New Query
# Copy and paste the contents of supabase-migration.sql
```

### 3. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Gmail SMTP Configuration
SMTP_EMAIL=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Your existing environment variables...
NEXT_PUBLIC_CLIENT_ID=your_thirdweb_client_id
# ... other vars
```

### 4. Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** > **2-Step Verification**
3. Enable 2-Step Verification if not already enabled
4. Go to **App passwords**
5. Generate a new app password for "Mail"
6. Use this password in `SMTP_PASS` environment variable

## File Structure

The registration system includes these files:

```
src/
├── lib/
│   └── form-handler.ts              # Core logic for database & email
├── app/
│   ├── api/
│   │   └── form/
│   │       └── route.ts             # API endpoint for registration
│   └── register/
│       └── page.tsx                 # Registration landing page
└── components/
    └── RegistrationForm.tsx         # Registration form component
```

## How It Works

1. **User submits form** → Data validated on client and server
2. **Database insert** → User data stored in `interested_users` table
3. **UPI QR generation** → QR code created for ₹49 payment
4. **Email sent** → User receives email with QR code and payment instructions
5. **Success response** → User sees confirmation message

## Testing

### 1. Test Email Configuration

Visit: `http://localhost:3000/api/form`

This will verify your email configuration and return:
```json
{
  "success": true,
  "emailConfigValid": true,
  "message": "Email configuration is working correctly"
}
```

### 2. Test Registration Flow

1. Visit: `http://localhost:3000/register`
2. Fill out the form with test data
3. Submit the form
4. Check your email for the payment QR code
5. Verify the user was created in Supabase

### 3. Database Verification

In Supabase Dashboard > Table Editor > `interested_users`:
- Check if the user record was created
- Verify all fields are populated correctly
- Confirm `registration_fee_paid` is `false` initially

## API Endpoints

### POST /api/form
Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",  // optional
  "wallet": "0x1234..."       // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Check your email for payment instructions.",
  "data": {
    "userId": "uuid-here",
    "email": "john@example.com",
    "upiLink": "upi://pay?pa=kunj@upi&am=49&cu=INR&tn=NFT%20Marketplace%20Registration",
    "qrCodeURL": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=..."
  }
}
```

### GET /api/form
Test email configuration

## Customization

### Change Payment Amount
Edit the amount in `src/lib/form-handler.ts`:
```typescript
const amount = "49"; // Change this value
```

### Modify UPI Details
Update the merchant UPI ID in `generateUPILink()`:
```typescript
function generateUPILink(merchantUPI: string = "your-upi@paytm"): string {
```

### Customize Email Template
Modify the `emailHTML` variable in `handleFormSubmission()` function.

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Verify Gmail App Password is correct
   - Check if 2-Step Verification is enabled
   - Ensure SMTP credentials are in environment variables

2. **Database connection issues**
   - Verify Supabase URL and keys
   - Check if RLS policies are set up correctly
   - Ensure service role key is used for admin operations

3. **Form submission errors**
   - Check browser console for client-side errors
   - Review server logs for API errors
   - Verify all required fields are provided

### Debugging

Enable detailed logging by checking the console output when:
- Form is submitted
- Database operations are performed
- Emails are sent

## Security Notes

- Service Role Key is used for bypassing RLS during registration
- RLS policies protect user data access
- Email validation is performed on both client and server
- Form includes CSRF protection via Next.js

## Next Steps

After setup is complete, you can:
1. Add payment verification webhook
2. Implement user dashboard
3. Add email verification before registration
4. Create admin panel for managing users
5. Add analytics and reporting

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify environment variables are set correctly
3. Test email configuration using the GET endpoint
4. Check Supabase logs for database errors
