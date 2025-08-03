import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createLead, createTransaction, updateTransactionStatus } from '@/lib/supabase-functions';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      userEmail,
      userName,
      userAddress,
      userPhone
    } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay configuration missing' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Verify payment signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (payment.status === 'captured') {
      const nftId = String(order.notes?.nft_id || '');
      const amount = Number(payment.amount) / 100; // Convert from paise to rupees

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
          transaction_id: payment.id,
          amount: amount
        });

        // Create transaction record
        if (leadResult.success && leadResult.data) {
          await createTransaction({
            lead_id: leadResult.data.id,
            payment_gateway: 'razorpay',
            gateway_txn_id: payment.id,
            amount: amount,
            currency: payment.currency,
            status: 'complete',
            gateway_response: {
              payment_id: payment.id,
              order_id: order.id,
              signature: razorpay_signature,
              method: payment.method,
              bank: payment.bank,
              wallet: payment.wallet
            }
          });
        }
      }

      return NextResponse.json({
        success: true,
        transactionId: payment.id,
        orderId: order.id,
        nftId: nftId,
        amount: amount,
        status: 'completed',
        method: payment.method
      });
    } else {
      return NextResponse.json(
        { error: 'Payment not captured', status: payment.status },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify Razorpay payment' },
      { status: 500 }
    );
  }
}
