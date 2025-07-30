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
    console.log('🔍 Verifying payment...')
    
    // Validate environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('Stripe configuration error: Missing API key')
    }

    // Parse request body
    const { sessionId } = await req.json()
    
    if (!sessionId) {
      throw new Error('Missing sessionId parameter')
    }

    console.log('📋 Verifying session:', sessionId)

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    console.log('💳 Session status:', session.payment_status)
    console.log('📊 Session mode:', session.mode)

    // Check if payment was successful
    const success = session.payment_status === 'paid' && session.mode === 'subscription'

    return new Response(
      JSON.stringify({ 
        success,
        sessionId,
        paymentStatus: session.payment_status,
        customerId: session.customer,
        subscriptionId: session.subscription
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error verifying payment:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})