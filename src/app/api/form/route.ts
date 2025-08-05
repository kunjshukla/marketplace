import { NextRequest, NextResponse } from 'next/server';
import { handleFormSubmission, verifyEmailConfig } from '@/lib/form-handler';

// POST /api/form - Handle form submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, message: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Process form submission
    const result = await handleFormSubmission({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim() || undefined,
      wallet: body.wallet?.trim() || undefined
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error("API route error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET /api/form - Test email configuration
export async function GET() {
  try {
    const isEmailConfigValid = await verifyEmailConfig();
    
    return NextResponse.json({
      success: true,
      emailConfigValid: isEmailConfigValid,
      message: isEmailConfigValid 
        ? "Email configuration is working correctly" 
        : "Email configuration needs attention"
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to verify email configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
