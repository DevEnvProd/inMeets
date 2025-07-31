import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  DollarSign,
  MapPin,
  MessageCircle,
  Brain,
  Star
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ClientForm } from '../components/Client/ClientForm'
import { ClientDetails } from '../components/Client/ClientDetails'
import { WhatsAppChat } from '../components/WhatsApp/WhatsAppChat'

export const Clients = () => {
  const { organization } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showClientForm, setShowClientForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [filterBudget, setFilterBudget] = useState('')

  useEffect(() => {
    if (organization) {
      fetchClients()
    }
  }, [organization])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          viewing_count:client_viewing_records(count),
          recommendations_count:ai_property_recommendations(count),
          latest_insight:client_ai_insights(
            insight_type,
            confidence_score,
            created_at
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client? This will also remove all associated data.')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
      await fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Error deleting client')
    }
  }

  const handleEditClient = (client) => {
    setEditingClient(client)
    setShowClientForm(true)
  }

  const handleViewClient = (client) => {
    setSelectedClient(client)
  }

  const handleWhatsAppChat = (client) => {
    setSelectedClient(client)
    setShowWhatsApp(true)
  }

  const handleFormClose = () => {
    setShowClientForm(false)
    setEditingClient(null)
    fetchClients()
  }

  const formatPrice = (price) => {
    if (!price) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price / 100)
  }

  const getIntentColor = (insights) => {
    if (!insights || insights.length === 0) return 'bg-gray-100 text-gray-800'
    
    const latestInsight = insights[0]
    if (latestInsight.insight_type === 'intent_level') {
      const level = latestInsight.insight_data?.level
      switch (level) {
        case 'high': return 'bg-green-100 text-green-800'
        case 'medium': return 'bg-yellow-100 text-yellow-800'
        case 'low': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }
    return 'bg-blue-100 text-blue-800'
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchTerm || 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    
    const matchesBudget = !filterBudget || 
      (filterBudget === 'low' && client.budget_max <= 50000000) ||
      (filterBudget === 'medium' && client.budget_max > 50000000 && client.budget_max <= 100000000) ||
      (filterBudget === 'high' && client.budget_max > 100000000)

    return matchesSearch && matchesBudget
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
              <p className="text-gray-600">Manage your clients and track their preferences</p>
            </div>
            <button
              onClick={() => setShowClientForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Client</span>
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <select
                  value={filterBudget}
                  onChange={(e) => setFilterBudget(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Budgets</option>
                  <option value="low">Under $500K</option>
                  <option value="medium">$500K - $1M</option>
                  <option value="high">Above $1M</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterBudget 
                ? 'Try adjusting your filters or search terms'
                : 'Get started by adding your first client'
              }
            </p>
            {!searchTerm && !filterBudget && (
              <button
                onClick={() => setShowClientForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
              <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                {/* Client Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {client.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {client.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Intent Badge */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntentColor(client.latest_insight)}`}>
                    {client.latest_insight?.[0]?.insight_data?.level || 'Unknown'} Intent
                  </span>
                </div>

                {/* Client Info */}
                <div className="space-y-3 mb-4">
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>
                      {formatPrice(client.budget_min)} - {formatPrice(client.budget_max)}
                    </span>
                  </div>

                  {client.preferred_areas && client.preferred_areas.length > 0 && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {client.preferred_areas.slice(0, 2).map((area, index) => (
                          <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {area}
                          </span>
                        ))}
                        {client.preferred_areas.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{client.preferred_areas.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {client.viewing_count?.[0]?.count || 0}
                    </div>
                    <div className="text-xs text-gray-600">Viewings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {client.recommendations_count?.[0]?.count || 0}
                    </div>
                    <div className="text-xs text-gray-600">AI Matches</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewClient(client)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {client.whatsapp_number && (
                      <button
                        onClick={() => handleWhatsAppChat(client)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="WhatsApp Chat"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClient(client)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Edit Client"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Client"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Client Form Modal */}
        {showClientForm && (
          <ClientForm
            isOpen={showClientForm}
            onClose={handleFormClose}
            client={editingClient}
          />
        )}

        {/* Client Details Modal */}
        {selectedClient && !showWhatsApp && (
          <ClientDetails
            client={selectedClient}
            isOpen={!!selectedClient}
            onClose={() => setSelectedClient(null)}
            onEdit={handleEditClient}
            onWhatsApp={handleWhatsAppChat}
          />
        )}

        {/* WhatsApp Chat Modal */}
        {selectedClient && showWhatsApp && (
          <WhatsAppChat
            client={selectedClient}
            isOpen={showWhatsApp}
            onClose={() => {
              setShowWhatsApp(false)
              setSelectedClient(null)
            }}
          />
        )}
      </div>
    </div>
  )
}