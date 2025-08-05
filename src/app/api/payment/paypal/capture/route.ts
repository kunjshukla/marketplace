import { NextRequest, NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';
import { createLead, updateTransactionStatus } from '@/lib/supabase-functions';

// PayPal environment setup
const environment = process.env.PAYPAL_ENVIRONMENT === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    );

const client = new paypal.core.PayPalHttpClient(environment);

export async function POST(request: NextRequest) {
  try {
    const { orderId, userEmail, userName, userAddress } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    // Capture the payment
    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
    const capture = await client.execute(captureRequest);

    if (capture.result.status === 'COMPLETED') {
      const paymentData = capture.result;
      const nftId = paymentData.purchase_units[0].custom_id;
      const amount = parseFloat(paymentData.purchase_units[0].payments.captures[0].amount.value);
      
      // Create lead in Supabase
      if (userEmail && userName) {
        await createLead({
          email: userEmail,
          name: userName,
          phone: '',
          address: userAddress,
          nft_purchased: nftId,
          payment_method: 'paypal',
          payment_status: 'complete',
          transaction_id: paymentData.id,
          amount: amount
        });
      }

      // Update transaction status
      await updateTransactionStatus(paymentData.id, 'complete', {
        capture_id: paymentData.purchase_units[0].payments.captures[0].id,
        payer_email: paymentData.payer?.email_address,
        payment_method: 'paypal'
      });

      // Set cache-control for 2 minutes for non-SSR freshness
      const res = NextResponse.json({
        success: true,
        transactionId: paymentData.id,
        captureId: paymentData.purchase_units[0].payments.captures[0].id,
        nftId: nftId,
        amount: amount,
        status: 'completed'
      });
      res.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
      return res;
    } else {
      return NextResponse.json(
        { error: 'Payment capture failed', status: capture.result.status },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal payment' },
      { status: 500 }
    );
  }
}
