import React, { useState, useEffect } from 'react'
import { Mail, Copy, Check, Trash2, Users, Clock, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export const InvitationManager = () => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')
  const { organization } = useAuth()

  useEffect(() => {
    if (organization) {
      fetchInvitations()
    }
  }, [organization])

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const sendInvitation = async (e) => {
    e.preventDefault()
    setSending(true)

    try {
      const code = generateInviteCode()
      
      const { error } = await supabase
        .from('invitations')
        .insert([
          {
            organization_id: organization.id,
            email: inviteEmail,
            code: code,
            created_by: (await supabase.auth.getUser()).data.user.id
          }
        ])

      if (error) throw error

      // In a real app, you would send an email here
      // For now, we'll just show the code to copy
      setInviteEmail('')
      fetchInvitations()
      
      // Show success message
      alert(`Invitation sent! Share this code with ${inviteEmail}: ${code}`)
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Error sending invitation: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const deleteInvitation = async (id) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchInvitations()
    } catch (error) {
      console.error('Error deleting invitation:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'expired':
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Team Invitations</h2>
        </div>
        
        {/* Send Invitation Form */}
        <form onSubmit={sendInvitation} className="flex space-x-3">
          <div className="flex-1">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address to invite"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Mail className="h-4 w-4" />
            <span>{sending ? 'Sending...' : 'Send Invite'}</span>
          </button>
        </form>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No invitations sent yet</p>
            <p className="text-sm text-gray-500">Send your first invitation to start building your team</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(invitation.status)}
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-600">
                      Invited {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                    {invitation.status}
                  </span>
                  
                  {invitation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => copyToClipboard(invitation.code)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        {copiedCode === invitation.code ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span>{copiedCode === invitation.code ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                      
                      <button
                        onClick={() => deleteInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}