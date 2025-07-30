import Stripe from 'npm:stripe@14.21.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎣 Stripe webhook received')
    
    // Validate environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    // Initialize Stripe and Supabase
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the signature and body
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    if (!signature) {
      throw new Error('Missing Stripe signature')
    }

    // Verify the webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified:', event.type)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      throw new Error(`Webhook signature verification failed: ${err.message}`)
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('💳 Processing successful checkout...')
        const session = event.data.object as Stripe.Checkout.Session
        const { organizationId, billingCycle, planName } = session.metadata || {}

        if (!organizationId) {
          console.error('❌ Missing organizationId in session metadata')
          break
        }

        // Calculate expiry date based on billing cycle
        const now = new Date()
        const expiryDate = new Date(now)
        
        if (billingCycle === 'yearly') {
          expiryDate.setFullYear(now.getFullYear() + 1)
        } else {
          expiryDate.setMonth(now.getMonth() + 1)
        }

        console.log('📅 Subscription expires:', expiryDate.toISOString())

        // Update organization with active subscription
        const { error } = await supabase
          .from('organizations')
          .update({
            subscription_status: 'active',
            stripe_subscription_id: session.subscription as string,
            subscription_expires_at: expiryDate.toISOString(),
            billing_cycle: billingCycle || 'monthly',
            updated_at: new Date().toISOString()
          })
          .eq('id', organizationId)

        if (error) {
          console.error('❌ Database update error:', error)
          throw error
        }

        console.log('✅ Organization subscription activated:', organizationId)
        break
      }

      case 'customer.subscription.deleted': {
        console.log('🚫 Processing subscription cancellation...')
        const subscription = event.data.object as Stripe.Subscription
        
        // Update organization to cancelled status
        const { error } = await supabase
          .from('organizations')
          .update({
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Database update error:', error)
          throw error
        }

        console.log('✅ Subscription cancelled:', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        console.log('💸 Processing failed payment...')
        const invoice = event.data.object as Stripe.Invoice
        
        // Update organization to past_due status
        const { error } = await supabase
          .from('organizations')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', invoice.subscription as string)

        if (error) {
          console.error('❌ Database update error:', error)
          throw error
        }

        console.log('✅ Subscription marked as past due:', invoice.subscription)
        break
      }

      case 'customer.subscription.updated': {
        console.log('🔄 Processing subscription update...')
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status based on Stripe status
        let status = 'active'
        if (subscription.status === 'canceled') status = 'cancelled'
        else if (subscription.status === 'past_due') status = 'past_due'
        else if (subscription.status === 'unpaid') status = 'past_due'

        const { error } = await supabase
          .from('organizations')
          .update({
            subscription_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Database update error:', error)
          throw error
        }

        console.log('✅ Subscription updated:', subscription.id, 'Status:', status)
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        received: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})