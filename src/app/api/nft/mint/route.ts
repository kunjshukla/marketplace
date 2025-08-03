import { NextRequest, NextResponse } from 'next/server';
import { updateLeadAfterPayment, findLeadByEmail } from '@/lib/supabase-functions';

export async function POST(request: NextRequest) {
  try {
    const {
      userEmail,
      nftId,
      transactionId,
      amount,
      currency,
      contractAddress,
      tokenMetadata
    } = await request.json();

    if (!userEmail || !nftId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail, nftId, transactionId' },
        { status: 400 }
      );
    }

    // Find the lead by email
    const leadResult = await findLeadByEmail(userEmail);
    if (!leadResult.success || !leadResult.data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const lead = leadResult.data;

    // Update lead with NFT information
    await updateLeadAfterPayment(lead.id, {
      txn_id: transactionId,
      amount: Number(amount),
      currency: currency,
      nft_id: nftId,
      contract_address: contractAddress
    });

    return NextResponse.json({
      success: true,
      nftId: nftId,
      transactionId: transactionId,
      contractAddress: contractAddress,
      userEmail: userEmail
    });

  } catch (error) {
    console.error('NFT minting error:', error);
    return NextResponse.json(
      { error: 'Failed to mint NFT', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
