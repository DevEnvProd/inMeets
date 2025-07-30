import React, { useState, useEffect } from 'react'
import { Users, Crown, User, Mail, MoreVertical, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { InvitationManager } from '../components/Organization/InvitationManager'

export const TeamManagement = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const { organization, user } = useAuth()
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    if (organization && user) {
      fetchTeamMembers()
      fetchUserRole()
    }
  }, [organization, user])

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .single()

      if (error) throw error
      setUserRole(data.role)
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          *,
          user:users(*)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRole = async (memberId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error
      fetchTeamMembers()
    } catch (error) {
      console.error('Error updating member role:', error)
    }
  }

  const removeMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        const { error } = await supabase
          .from('user_organizations')
          .delete()
          .eq('id', memberId)

        if (error) throw error
        fetchTeamMembers()
      } catch (error) {
        console.error('Error removing member:', error)
      }
    }
  }

  const getRoleIcon = (role) => {
    return role === 'organizer' ? (
      <Crown className="h-4 w-4 text-yellow-600" />
    ) : (
      <User className="h-4 w-4 text-blue-600" />
    )
  }

  const getRoleColor = (role) => {
    return role === 'organizer' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
          <p className="text-gray-600">
            Manage your organization members and send invitations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Members */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                  {members.length}
                </span>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {member.user?.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user?.email}
                            {member.user_id === user.id && (
                              <span className="text-sm text-gray-500 ml-2">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            Joined {new Date(member.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(member.role)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                        </div>

                        {userRole === 'organizer' && member.user_id !== user.id && (
                          <div className="relative">
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {/* In a real app, this would be a dropdown menu */}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Invitation Manager */}
          {userRole === 'organizer' && (
            <InvitationManager />
          )}
        </div>
      </div>
    </div>
  )
}