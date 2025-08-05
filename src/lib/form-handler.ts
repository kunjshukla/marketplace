import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Lazy initialization functions to avoid build-time environment variable requirements
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getEmailTransporter() {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpEmail || !smtpPass) {
    throw new Error("Missing email configuration. Please check SMTP_EMAIL and SMTP_PASS in your .env.local file.");
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPass, // Use Gmail App Password
    },
  });
}

// User interface for form submission
interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  wallet?: string;
}

// Generate UPI payment link with fixed ₹49 amount
function generateUPILink(merchantUPI: string = "kunj@upi"): string {
  const amount = "49";
  const currency = "INR";
  const note = "NFT Marketplace Registration";
  
  return `upi://pay?pa=${merchantUPI}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
}

// Generate QR code URL using a free QR service
function generateQRCodeURL(upiLink: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
}

// Main form submission handler
export async function handleFormSubmission(user: UserFormData) {
  try {
    // Initialize clients
    const supabase = getSupabaseClient();
    const transporter = getEmailTransporter();
    
    // Step 1: Insert user data into Supabase
    console.log("Inserting user into database...");
    
    const { data: insertedUser, error: insertError } = await supabase
      .from('interested_users')
      .insert([{
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        wallet_address: user.wallet || null,
        registration_fee_paid: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log("User inserted successfully:", insertedUser.id);

    // Step 2: Generate UPI QR code
    const upiLink = generateUPILink();
    const qrCodeURL = generateQRCodeURL(upiLink);
    
    console.log("Generated UPI link:", upiLink);
    console.log("Generated QR code URL:", qrCodeURL);

    // Step 3: Send email with UPI QR code
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; background: #4F46E5; color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
          .qr-section { text-align: center; padding: 20px; background: white; border-radius: 8px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to NFT Marketplace!</h1>
            <p>Thank you for your interest, ${user.name}!</p>
          </div>
          
          <div class="content">
            <h2>Complete Your Registration</h2>
            <p>To complete your registration and gain access to our exclusive NFT marketplace, please pay the registration fee of <strong>₹49</strong>.</p>
            
            <div class="qr-section">
              <h3>📱 Scan QR Code to Pay</h3>
              <img src="${qrCodeURL}" alt="UPI Payment QR Code" style="max-width: 200px; height: auto;" />
              <p><strong>Amount: ₹49</strong></p>
              <p>Or click the button below to pay via UPI:</p>
              <a href="${upiLink}" class="button">Pay with UPI</a>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #FEF3C7; border-radius: 6px;">
              <h4>📋 Your Registration Details:</h4>
              <ul>
                <li><strong>Name:</strong> ${user.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                ${user.phone ? `<li><strong>Phone:</strong> ${user.phone}</li>` : ''}
                ${user.wallet ? `<li><strong>Wallet:</strong> ${user.wallet}</li>` : ''}
                <li><strong>Registration ID:</strong> ${insertedUser.id.slice(0, 8)}...</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>If you have any questions, reply to this email or contact our support team.</p>
            <p>NFT Marketplace Team | Powered by Supabase & Next.js</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"NFT Marketplace" <${process.env.SMTP_EMAIL}>`,
      to: user.email,
      subject: "🎉 Complete Your NFT Marketplace Registration - Pay ₹49",
      html: emailHTML,
      text: `
        Welcome to NFT Marketplace, ${user.name}!
        
        To complete your registration, please pay ₹49 using this UPI link:
        ${upiLink}
        
        Your Registration ID: ${insertedUser.id.slice(0, 8)}...
        
        Thank you for joining us!
      `
    };

    console.log("Sending email to:", user.email);
    
    const emailResult = await transporter.sendMail(mailOptions);
    
    console.log("Email sent successfully:", emailResult.messageId);

    // Step 4: Return success response
    return {
      success: true,
      message: "Registration successful! Check your email for payment instructions.",
      data: {
        userId: insertedUser.id,
        email: user.email,
        upiLink,
        qrCodeURL
      }
    };

  } catch (error) {
    console.error("Form submission error:", error);
    
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
    const errorName = error instanceof Error ? error.name : "UnknownError";
    
    // Return structured error response
    return {
      success: false,
      message: errorMessage,
      error: {
        type: errorName,
        details: errorMessage
      }
    };
  }
}

// Verify email configuration function
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log("✅ Email configuration verified");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return false;
  }
}
