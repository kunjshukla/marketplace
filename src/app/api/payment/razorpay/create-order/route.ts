import { NextRequest, NextResponse } from 'next/server';
// import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const { nftId, amount, currency = 'INR', userEmail, userName } = await request.json();

    if (!nftId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: nftId, amount' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay configuration missing' },
        { status: 500 }
      );
    }

    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET,
    // });

    const options = {
      amount: Math.round(amount * 100), // Amount in smallest currency unit (paise for INR)
      currency: currency,
      receipt: `nft_${nftId}_${Date.now()}`,
      notes: {
        nft_id: nftId,
        user_email: userEmail || '',
        user_name: userName || ''
      }
    };

    // const order = await razorpay.orders.create(options);

    // return NextResponse.json({
    //   orderId: order.id,
    //   amount: order.amount,
    //   currency: order.currency,
    //   receipt: order.receipt,
    //   status: order.status
    // });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}
