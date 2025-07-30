import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const getStripe = () => stripePromise

/**
 * Create a Stripe checkout session for subscription
 */
export const createCheckoutSession = async (plan, organizationId, billingCycle = 'monthly') => {
  try {
    console.log('🔄 Creating Stripe checkout session...')
    console.log('Plan:', plan.name)
    console.log('Billing cycle:', billingCycle)
    console.log('Organization ID:', organizationId)
    
    // Get the correct Stripe price ID based on billing cycle
    const priceId = billingCycle === 'yearly' 
      ? plan.id 
      : plan.id

    console.log('Selected price ID:', priceId)

    if (!priceId) {
      throw new Error(`Price ID not found for plan "${plan.name}" with billing cycle "${billingCycle}". Please ensure the plan has valid Stripe price IDs configured.`)
    }

    // Call Supabase Edge Function to create checkout session
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        priceId,
        organizationId,
        billingCycle,
        planName: plan.name
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }

    console.log('✅ Checkout session created:', data.sessionId)

    // Redirect to Stripe Checkout
    const stripe = await getStripe()
    const { error } = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    })

    if (error) {
      console.error('❌ Stripe redirect error:', error)
      throw error
    }
  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    throw error
  }
}

/**
 * Check if payment was successful
 */
export const checkPaymentSuccess = async (sessionId) => {
  try {
    console.log('🔍 Checking payment status for session:', sessionId)
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ sessionId }),
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('❌ Payment verification error:', data.error)
      return false
    }

    console.log('✅ Payment status:', data.success ? 'SUCCESS' : 'FAILED')
    return data.success
  } catch (error) {
    console.error('❌ Error checking payment status:', error)
    return false
  }
}

/**
 * Format price for display
 */
export const formatPrice = (priceInCents, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(priceInCents / 100)
}

/**
 * Calculate yearly savings percentage
 */
export const calculateYearlySavings = (monthlyPrice, yearlyPrice) => {
  const monthlyCost = monthlyPrice * 12
  const savings = ((monthlyCost - yearlyPrice) / monthlyCost) * 100
  return Math.round(savings)
}