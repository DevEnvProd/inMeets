import React, { useState, useEffect } from 'react'
import { X, Check, Crown, Zap, Building2, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { createCheckoutSession, formatPrice, calculateYearlySavings } from '../../lib/stripe'
import { useAuth } from '../../contexts/AuthContext'

export const SubscriptionModal = ({ isOpen, onClose, onSelectPlan }) => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const { organization } = useAuth()

  useEffect(() => {
    if (isOpen) {
      fetchPlans()
    }
  }, [isOpen])

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly')

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
      // Fallback to demo data
      setPlans([
        {
          id: 'starter',
          name: 'Starter',
          description: 'Perfect for individual agents',
          price_monthly: 29,
          price_yearly: 290,
          max_users: 1,
          stripe_price_id_monthly: 'price_starter_monthly',
          stripe_price_id_yearly: 'price_starter_yearly',
          features: {
            list: ['Up to 50 properties', 'Basic CRM', 'Email support', 'Mobile app']
          }
        },
        {
          id: 'professional',
          name: 'Professional',
          description: 'Great for small teams',
          price_monthly: 79,
          price_yearly: 790,
          max_users: 5,
          stripe_price_id_monthly: 'price_professional_monthly',
          stripe_price_id_yearly: 'price_professional_yearly',
          features: {
            list: ['Up to 500 properties', 'Advanced CRM', 'AI insights', 'Priority support', 'Team collaboration']
          }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'For large organizations',
          price_monthly: 199,
          price_yearly: 1990,
          max_users: 50,
          stripe_price_id_monthly: 'price_enterprise_monthly',
          stripe_price_id_yearly: 'price_enterprise_yearly',
          features: {
            list: ['Unlimited properties', 'Full CRM suite', 'Advanced AI', '24/7 support', 'Custom integrations', 'API access']
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (plan) => {
    setProcessingPayment(true)
    
    try {
      console.log('🎯 User selected plan:', plan.name, 'Billing:', billingCycle)
      
      const organizationId = organization?.id || localStorage.getItem('pendingOrganizationId')
      
      if (!organizationId) {
        throw new Error('No organization found')
      }
      
      // Create Stripe checkout session and redirect to payment
      // Organization will be updated by webhook after successful payment
      await createCheckoutSession(plan, organizationId, billingCycle)
      
    } catch (error) {
      console.error('Payment processing error:', error)
      alert(`Payment processing failed: ${error.message}`)
    } finally {
      setProcessingPayment(false)
    }
  }

  if (!isOpen) return null

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return <Building2 className="h-8 w-8" />
      case 'professional':
        return <Zap className="h-8 w-8" />
      case 'enterprise':
        return <Crown className="h-8 w-8" />
      default:
        return <Building2 className="h-8 w-8" />
    }
  }

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return 'border-blue-200 bg-blue-50'
      case 'professional':
        return 'border-teal-200 bg-teal-50'
      case 'enterprise':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-600">
            Select the perfect plan for your organization
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center mt-6 mb-8">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">
                  Save {calculateYearlySavings(plans[0]?.price_monthly || 2900, plans[0]?.price_yearly || 29000)}%
                </span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 hover:shadow-lg transition-shadow ${getPlanColor(plan.name)}`}
              >
                {plan.name.toLowerCase() === 'professional' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-white shadow-sm">
                    {getPlanIcon(plan.name)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatPrice(billingCycle === 'yearly' ? Math.floor(plan.price_yearly / 12) : plan.price_monthly)}
                    <span className="text-lg font-normal text-gray-600">
                      /{billingCycle === 'yearly' ? 'month' : 'month'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-gray-600">
                      Billed annually ({formatPrice(plan.price_yearly)}/year)
                    </div>
                  )}
                  {billingCycle === 'monthly' && (
                    <div className="text-sm text-gray-600">
                      Billed monthly
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Up to {plan.max_users} {plan.max_users === 1 ? 'user' : 'users'}
                  </div>
                  {(plan.features?.list || plan.features)?.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={processingPayment}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    plan.name.toLowerCase() === 'professional'
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Start {billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Plan</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🔒 Secure payment powered by Stripe • Cancel anytime • 30-day money-back guarantee</p>
        </div>
      </div>
    </div>
  )
}