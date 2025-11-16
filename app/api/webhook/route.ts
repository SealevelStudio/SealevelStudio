import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Webhook endpoint for receiving external notifications
 * Handles POST requests and logs all incoming webhook data
 */
export async function POST(request: NextRequest) {
  try {
    // Get all headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    console.log('Received webhook. Request details:');
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('URL:', request.url);
    console.log('Method:', request.method);

    // Parse request body
    let body: any;
    try {
      const bodyText = await request.text();
      
      if (bodyText) {
        try {
          body = JSON.parse(bodyText);
          console.log('Parsed JSON data:');
          console.log(JSON.stringify(body, null, 2));
        } catch (jsonError) {
          console.log('Error parsing JSON:', jsonError instanceof Error ? jsonError.message : String(jsonError));
          console.log('Raw body:', bodyText);
          body = bodyText;
        }
      } else {
        console.log('Empty body received');
        body = null;
      }
    } catch (error) {
      console.error('Error reading request body:', error);
      body = null;
    }

    // Log query parameters if any
    const searchParams = request.nextUrl.searchParams;
    if (searchParams.toString()) {
      const queryParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
      console.log('Query parameters:', JSON.stringify(queryParams, null, 2));
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook received',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests (for testing/health checks)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'Webhook endpoint is active',
      method: 'POST',
      endpoint: '/api/webhook',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}

