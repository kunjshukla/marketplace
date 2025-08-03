import { NextRequest, NextResponse } from 'next/server';
import paypal from '@paypal/checkout-server-sdk';

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
    const { nftId, amount, currency = 'USD' } = await request.json();

    if (!nftId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: nftId, amount' },
        { status: 400 }
      );
    }

    const requestBody = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toString()
        },
        description: `NFT Purchase - Token ID: ${nftId}`,
        custom_id: nftId
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        brand_name: 'NFT Marketplace',
        user_action: 'PAY_NOW'
      }
    };

    const orderRequest = new paypal.orders.OrdersCreateRequest();
    orderRequest.prefer('return=representation');
    orderRequest.requestBody(requestBody);

    const order = await client.execute(orderRequest);

    return NextResponse.json({
      orderId: order.result.id,
      status: order.result.status,
      links: order.result.links
    });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
