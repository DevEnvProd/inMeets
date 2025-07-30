import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Home,
  Calendar,
  Mail
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { OrganizationModal } from '../components/Organization/OrganizationModal'
import { SubscriptionModal } from '../components/Subscription/SubscriptionModal'
import { checkPaymentSuccess } from '../lib/stripe'

export const Dashboard = () => {
  const { user, organization, fetchUserOrganization } = useAuth()
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [searchParams] = useSearchParams()
  const paymentHandlerRef = useRef(false)

  // Handle payment success/failure
  useEffect(() => {
    const handlePaymentResult = async () => {
      if (paymentHandlerRef.current) return
      paymentHandlerRef.current = true

      const success = searchParams.get('success')
      const sessionId = searchParams.get('session_id')
      const canceled = searchParams.get('canceled')

      if (success === 'true' && sessionId) {
        console.log('🎉 Payment success detected, verifying...')
        // Verify payment was successful
        const paymentSuccessful = await checkPaymentSuccess(sessionId)
        if (paymentSuccessful) {
          //console.log('Payment verified successfully')
          await fetchUserOrganization(user.id)
          window.history.replaceState({}, document.title, '/dashboard')
          alert('Payment completed successfully!')
        } else {
          //console.log('Payment verification failed')
          window.history.replaceState({}, document.title, '/dashboard')
          alert('Payment verification failed. Please contact support if you believe this is an error.')
        }        
      } else if (canceled === 'true') {
        //console.log('🚫 Payment was canceled by user')
        // Clear URL parameters
        window.history.replaceState({}, document.title, '/dashboard')
        // Show canceled message
        alert('💳 Payment was canceled. You can try subscribing again anytime.')
      }
    }

    if (searchParams.get('success') || searchParams.get('canceled')) {
      handlePaymentResult()
    }
  }, [searchParams, user, fetchUserOrganization])

  
  useEffect(() => {
    if (user && (!organization || !organization.id)) {
      setShowOrgModal(true)
    } else {
      setShowOrgModal(false)
    }
  }, [user, organization])

  useEffect(() => {
    // Global function to show subscription modal
    window.showSubscriptionModal = () => {
      setShowSubscriptionModal(true)
    }
    
    return () => {
      delete window.showSubscriptionModal
    }
  }, [])
  const handleCreateOrganization = () => {
    setShowSubscriptionModal(true)
  }

  const handleSelectPlan = async (plan) => {
    console.log('Selected plan:', plan)
    // Refresh user organization after payment
    await fetchUserOrganization(user.id)
    setShowSubscriptionModal(false)
  }

  // Check if organization has active subscription
  const hasActiveSubscription = organization?.subscription_status === 'active'

  // Show subscription modal if organization exists but no active subscription
  useEffect(() => {
    if (organization && !hasActiveSubscription && !showSubscriptionModal && !searchParams.get('success')) {
      setShowSubscriptionModal(true)
    }
  }, [organization, hasActiveSubscription, showSubscriptionModal, searchParams])

  // Don't show dashboard content if no active subscription
  if (organization && !hasActiveSubscription && !searchParams.get('success')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Required</h2>
          <p className="text-gray-600 mb-6">Please complete your subscription to access the dashboard.</p>
          <SubscriptionModal
            isOpen={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
            onSelectPlan={handleSelectPlan}
          />
        </div>
      </div>
    )
  }

  // Demo data
  const stats = [
    {
      name: 'Total Properties',
      value: '24',
      change: '+12%',
      changeType: 'increase',
      icon: Home
    },
    {
      name: 'Active Clients',
      value: '156',
      change: '+8%',
      changeType: 'increase',
      icon: Users
    },
    {
      name: 'Monthly Revenue',
      value: '$48,350',
      change: '+23%',
      changeType: 'increase',
      icon: DollarSign
    },
    {
      name: 'Pending Deals',
      value: '8',
      change: '+4%',
      changeType: 'increase',
      icon: TrendingUp
    }
  ]

  const recentProperties = [
    {
      id: 1,
      title: 'Modern Downtown Condo',
      address: '123 Main St, New York, NY',
      price: '$850,000',
      status: 'Active',
      type: 'Condo',
      bedrooms: 2,
      bathrooms: 2,
      image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      title: 'Luxury Family Home',
      address: '456 Oak Ave, Los Angeles, CA',
      price: '$1,250,000',
      status: 'Pending',
      type: 'House',
      bedrooms: 4,
      bathrooms: 3,
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 3,
      title: 'Cozy Suburban House',
      address: '789 Pine St, Chicago, IL',
      price: '$650,000',
      status: 'Sold',
      type: 'House',
      bedrooms: 3,
      bathrooms: 2,
      image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      action: 'New inquiry received',
      client: 'Sarah Johnson',
      property: 'Modern Downtown Condo',
      time: '2 hours ago',
      type: 'inquiry'
    },
    {
      id: 2,
      action: 'Property listing updated',
      client: 'System',
      property: 'Luxury Family Home',
      time: '4 hours ago',
      type: 'update'
    },
    {
      id: 3,
      action: 'Viewing scheduled',
      client: 'Mike Chen',
      property: 'Cozy Suburban House',
      time: '6 hours ago',
      type: 'viewing'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          {organization && (
            <p className="text-gray-600">
              Managing properties for <span className="font-semibold">{organization.name}</span>
              {organization.subscription_expires_at && organization.subscription_status === 'active' && (
                <span className="text-sm text-gray-500 block">
                  🔄 {organization.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'} subscription expires: {new Date(organization.subscription_expires_at).toLocaleDateString()}
                </span>
              )}
              {organization.subscription_status !== 'active' && (
                <span className="text-sm text-red-600 block">
                  Subscription status: {organization.subscription_status}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-600 ml-1">from last month</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Properties */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Recent Properties</h2>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Search className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Filter className="h-5 w-5" />
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Property</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {recentProperties.map((property) => (
                    <div key={property.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{property.title}</h3>
                        <p className="text-sm text-gray-600">{property.address}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{property.bedrooms} bed</span>
                          <span>{property.bathrooms} bath</span>
                          <span>{property.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{property.price}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          property.status === 'Active' ? 'bg-green-100 text-green-800' :
                          property.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'inquiry' ? 'bg-blue-100' :
                        activity.type === 'update' ? 'bg-teal-100' :
                        'bg-orange-100'
                      }`}>
                        {activity.type === 'inquiry' ? (
                          <Mail className="h-4 w-4 text-blue-600" />
                        ) : activity.type === 'update' ? (
                          <Building2 className="h-4 w-4 text-teal-600" />
                        ) : (
                          <Calendar className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.client} • {activity.property}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3">
                    <Plus className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Add New Property</span>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3">
                    <Users className="h-5 w-5 text-teal-600" />
                    <span className="font-medium">Add New Client</span>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Schedule Viewing</span>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Send Email Campaign</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <OrganizationModal
        isOpen={showOrgModal}
        onClose={() => setShowOrgModal(false)}
      />
      
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  )
}