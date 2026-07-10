import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../../lib/supabase';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // 1. Fetch Webhook Secret from Environment variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';

    if (!signature) {
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 });
    }

    // 2. Cryptographic signature matching verification
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 400 });
    }

    // 3. Process parsed webhook event payload
    const event = JSON.parse(rawBody);
    console.log("Verified Webhook Event:", event.event);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      
      // Update order status in Supabase table
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'Placed', 
          paymentId: payment.id,
          paymentStatus: 'Paid' 
        })
        .eq('paymentId', razorpayOrderId);

      if (error) {
        console.error("Supabase update error inside webhook:", error);
        return NextResponse.json({ success: false, error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Payment confirmed and order updated for Razorpay Order ID: ${razorpayOrderId}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook verified successfully' });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
