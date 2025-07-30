import React, { useState } from 'react'
import { X, Building2, Users, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export const OrganizationModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, fetchUserOrganization } = useAuth()

  // Create organization form
  const [orgName, setOrgName] = useState('')
  const [orgDescription, setOrgDescription] = useState('')

  // Join organization form
  const [inviteCode, setInviteCode] = useState('')

  const handleCreateOrganization = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: orgName,
            description: orgDescription,
            created_by: user.id,
            subscription_status: 'pending'
          }
        ])
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as organizer
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert([
          {
            user_id: user.id,
            organization_id: orgData.id,
            role: 'organizer'
          }
        ])

      if (userOrgError) throw userOrgError

      // Store organization ID for payment process
      localStorage.setItem('pendingOrganizationId', orgData.id)
      
      onClose()
      
      // Trigger subscription modal
      if (window.showSubscriptionModal) {
        window.showSubscriptionModal()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrganization = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Find invitation by code
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', inviteCode)
        .eq('status', 'pending')
        .single()

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation code')
      }

      // Add user to organization
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert([
          {
            user_id: user.id,
            organization_id: invitation.organization_id,
            role: 'member'
          }
        ])

      if (userOrgError) throw userOrgError

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'accepted', used_by: user.id })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      await fetchUserOrganization(user.id)
      onClose()
      
      // Show success message
      alert('Successfully joined the organization!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Organization
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'join'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Join Organization
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateOrganization} className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your Organization</h3>
              <p className="text-gray-600 text-sm">Set up your real estate business and start managing properties</p>
            </div>

            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="orgDescription"
                value={orgDescription}
                onChange={(e) => setOrgDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your organization"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinOrganization} className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Join an Organization</h3>
              <p className="text-gray-600 text-sm">Enter the invitation code provided by your organization</p>
            </div>

            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                Invitation Code
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter invitation code"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Organization'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}