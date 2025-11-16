// Next.js API route to proxy Dune Analytics queries

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DUNE_API_BASE = 'https://api.dune.com/api/v1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Security: API keys should only come from environment variables, never from query parameters
    const apiKey = process.env.DUNE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Dune API key required. Set DUNE_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const queryId = searchParams.get('queryId');
    const action = searchParams.get('action') || 'results'; // results, execute, status

    if (!queryId && action === 'results') {
      return NextResponse.json(
        { error: 'Query ID required for results' },
        { status: 400 }
      );
    }

    let url = '';
    
    switch (action) {
      case 'results':
        url = `${DUNE_API_BASE}/query/${queryId}/results`;
        break;
      case 'execute':
        url = `${DUNE_API_BASE}/query/${queryId}/execute`;
        break;
      case 'status':
        url = `${DUNE_API_BASE}/execution/${queryId}/status`;
        break;
      default:
        url = `${DUNE_API_BASE}/query/${queryId}/results`;
    }

    const response = await fetch(url, {
      headers: {
        'X-Dune-API-Key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Dune API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dune Analytics proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

