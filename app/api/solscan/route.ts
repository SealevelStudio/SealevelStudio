// Next.js API route to proxy Solscan API requests

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SOLSCAN_API_BASE = 'https://api.solscan.io';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Security: API keys should only come from environment variables, never from query parameters
    const apiKey = process.env.SOLSCAN_API_KEY;
    
    const endpoint = searchParams.get('endpoint') || 'account';
    const address = searchParams.get('address');
    const action = searchParams.get('action') || 'info'; // info, tokens, transactions, etc.

    if (!address && endpoint === 'account') {
      return NextResponse.json(
        { error: 'Address required for account lookup' },
        { status: 400 }
      );
    }

    let url = '';
    
    switch (endpoint) {
      case 'account':
        switch (action) {
          case 'info':
            url = `${SOLSCAN_API_BASE}/account?address=${address}`;
            break;
          case 'tokens':
            url = `${SOLSCAN_API_BASE}/account/tokens?address=${address}`;
            break;
          case 'transactions':
            url = `${SOLSCAN_API_BASE}/account/transactions?address=${address}`;
            break;
          default:
            url = `${SOLSCAN_API_BASE}/account?address=${address}`;
        }
        break;
      case 'token':
        url = `${SOLSCAN_API_BASE}/token/meta?tokenAddress=${address}`;
        break;
      case 'market':
        url = `${SOLSCAN_API_BASE}/market/token/price?tokenAddress=${address}`;
        break;
      default:
        url = `${SOLSCAN_API_BASE}/account?address=${address}`;
    }

    const response = await fetch(url, {
      headers: {
        ...(apiKey ? { 'token': apiKey } : {}),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Solscan API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Solscan proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

