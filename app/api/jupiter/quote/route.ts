// Next.js API route to proxy Jupiter quote requests (fixes CORS issues)

import { NextRequest, NextResponse } from 'next/server';

const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const inputMint = searchParams.get('inputMint');
    const outputMint = searchParams.get('outputMint');
    const amount = searchParams.get('amount');
    const slippageBps = searchParams.get('slippageBps') || '50';

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: inputMint, outputMint, amount' },
        { status: 400 }
      );
    }

    // Build Jupiter API URL
    const url = `${JUPITER_API_BASE}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
    
    // Fetch from Jupiter API
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Jupiter API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract price and fee from Jupiter response
    if (data && data.outAmount && data.inAmount) {
      const inAmount = BigInt(data.inAmount);
      const outAmount = BigInt(data.outAmount);
      const price = Number(outAmount) / Number(inAmount);
      
      // Estimate fee (Jupiter aggregates, so fee varies)
      const fee = data.routePlan?.[0]?.swapInfo?.feeMint || 30;
      
      return NextResponse.json({
        price,
        fee,
        inAmount: data.inAmount,
        outAmount: data.outAmount,
        routePlan: data.routePlan,
      });
    }

    return NextResponse.json(
      { error: 'Invalid response from Jupiter API' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Jupiter quote proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
