import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '8';
    
    // Make request to FastAPI backend
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-backend.herokuapp.com' 
      : 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/nfts?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}
