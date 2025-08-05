import { NextRequest, NextResponse } from 'next/server';
import { createLead, createTransaction } from '@/lib/supabase-functions';

export async function POST(request: NextRequest) {
  try {
    const {
      userEmail,
      userName,
      userAddress,
      userPhone,
      nftId,
      amount,
      transactionId,
      orderId
    } = await request.json();

    // Create lead in Supabase
    if (userEmail && userName) {
      const leadResult = await createLead({
        email: userEmail,
        name: userName,
        phone: userPhone || '',
        address: userAddress,
        nft_purchased: nftId,
        payment_method: 'razorpay',
        payment_status: 'complete',
        transaction_id: transactionId,
        amount: amount
      });

      // Create transaction record

      // Set cache-control for 2 minutes for non-SSR freshness
      const res = NextResponse.json({
        success: true,
        transactionId: transactionId,
        orderId: orderId,
        nftId: nftId,
        amount: amount,
        status: 'completed',
        method: 'razorpay'
      });
      res.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
      return res;
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  } 
}
