/**
 * Email Verification Endpoint
 * POST /api/wallet/verify-email
 * 
 * If only email provided: Sends verification email
 * Body: { email: string }
 * 
 * If email + token provided: Verifies email token
 * Body: { email: string, token: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createEmailVerificationToken, verifyEmailToken } from '@/app/lib/wallet-recovery/email-verification';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, token } = body;

    // If token is provided, verify it
    if (token) {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for verification', success: false },
          { status: 400 }
        );
      }

      const result = await verifyEmailToken(token);

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error || 'Failed to verify email',
            success: false,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        email: result.email,
      });
    }

    // If only email provided, send verification email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', success: false },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', success: false },
        { status: 400 }
      );
    }

    const result = await createEmailVerificationToken(email);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to send verification email',
          success: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      ...(process.env.NODE_ENV === 'development' && result.token && {
        token: result.token, // Return token in dev mode for testing
      }),
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process email verification',
        success: false,
      },
      { status: 500 }
    );
  }
}

