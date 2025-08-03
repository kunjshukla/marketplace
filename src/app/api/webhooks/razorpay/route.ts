import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateTransactionStatus } from '@/lib/supabase-functions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    await updateTransactionStatus(payment.id, 'complete', {
      webhook_event: 'payment.captured',
      payment_method: payment.method,
      bank: payment.bank,
      wallet: payment.wallet,
      captured_at: payment.captured_at
    });

    // Trigger NFT minting process
    if (payment.notes?.user_email && payment.notes?.nft_id) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/nft/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: payment.notes.user_email,
          nftId: payment.notes.nft_id,
          transactionId: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
        }),
      });
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    await updateTransactionStatus(payment.id, 'failed', {
      webhook_event: 'payment.failed',
      error_code: payment.error_code,
      error_description: payment.error_description,
      failure_reason: payment.failure_reason
    });
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    console.log('Order paid webhook received:', order.id);
    // Additional order processing logic can be added here
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}
