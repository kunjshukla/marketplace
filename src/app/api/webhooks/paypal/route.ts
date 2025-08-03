import { NextRequest, NextResponse } from 'next/server';
import { updateTransactionStatus } from '@/lib/supabase-functions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body;

    // Basic webhook validation (you may want to add PayPal signature verification)
    if (!event.event_type || !event.resource) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event.resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event.resource);
        break;
      case 'CHECKOUT.ORDER.COMPLETED':
        await handleCheckoutOrderCompleted(event.resource);
        break;
      default:
        console.log('Unhandled PayPal webhook event:', event.event_type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PayPal webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptureCompleted(resource: any) {
  try {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    
    if (orderId) {
      await updateTransactionStatus(orderId, 'complete', {
        webhook_event: 'PAYMENT.CAPTURE.COMPLETED',
        capture_id: resource.id,
        amount: resource.amount,
        status: resource.status,
        create_time: resource.create_time,
        update_time: resource.update_time
      });

      // Trigger NFT minting if custom_id (nftId) is present
      if (resource.custom_id) {
        // Extract user info from resource or make additional API call
        // This would require storing user info during order creation
        console.log('PayPal payment completed, trigger NFT minting for:', resource.custom_id);
      }
    }
  } catch (error) {
    console.error('Error handling PayPal payment capture completed:', error);
  }
}

async function handlePaymentCaptureDenied(resource: any) {
  try {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    
    if (orderId) {
      await updateTransactionStatus(orderId, 'failed', {
        webhook_event: 'PAYMENT.CAPTURE.DENIED',
        capture_id: resource.id,
        status: resource.status,
        reason_code: resource.reason_code
      });
    }
  } catch (error) {
    console.error('Error handling PayPal payment capture denied:', error);
  }
}

async function handleCheckoutOrderCompleted(resource: any) {
  try {
    console.log('PayPal checkout order completed:', resource.id);
    // Additional order completion logic can be added here
  } catch (error) {
    console.error('Error handling PayPal checkout order completed:', error);
  }
}
