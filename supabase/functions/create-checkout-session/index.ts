import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Creating Stripe checkout session...')
    
    // Validate environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY environment variable is not set')
      throw new Error('Stripe configuration error: Missing API key')
    }

    // Parse request body
    const { priceId, organizationId, billingCycle, planName } = await req.json()
    
    console.log('📋 Request details:', {
      priceId,
      organizationId,
      billingCycle,
      planName
    })

    // Validate required parameters
    if (!priceId || !organizationId || !billingCycle) {
      throw new Error('Missing required parameters: priceId, organizationId, or billingCycle')
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Get the origin for redirect URLs
    const origin = req.headers.get('origin') || 'http://localhost:5173'

    // Create Stripe checkout session
    console.log('🛒 Creating Stripe checkout session...')
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      metadata: {
        organizationId,
        billingCycle,
        planName: planName || 'Unknown',
      },
      subscription_data: {
        metadata: {
          organizationId,
          billingCycle,
          planName: planName || 'Unknown',
        },
      },
      customer_creation: 'always',
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    })

    console.log('✅ Checkout session created successfully:', session.id)

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error creating checkout session:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to create Stripe checkout session'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})