import React, { useState, useEffect } from 'react'
import { 
  X, 
  Edit, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Star, 
  Brain,
  DollarSign,
  Phone,
  Mail,
  User,
  Building2,
  TrendingUp,
  Plus
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ViewingRecordForm } from './ViewingRecordForm'

export const ClientDetails = ({ client, isOpen, onClose, onEdit, onWhatsApp }) => {
  const { organization } = useAuth()
  const [viewingRecords, setViewingRecords] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [aiInsights, setAiInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showViewingForm, setShowViewingForm] = useState(false)

  useEffect(() => {
    if (client && isOpen) {
      fetchClientData()
    }
  }, [client, isOpen])

  const fetchClientData = async () => {
    try {
      await Promise.all([
        fetchViewingRecords(),
        fetchAiRecommendations(),
        fetchAiInsights()
      ])
    } catch (error) {
      console.error('Error fetching client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchViewingRecords = async () => {
    const { data, error } = await supabase
      .from('client_viewing_records')
      .select(`
        *,
        property:properties(title, address, price, images)
      `)
      .eq('client_id', client.id)
      .order('viewing_date', { ascending: false })

    if (error) throw error
    setViewingRecords(data || [])
  }

  const fetchAiRecommendations = async () => {
    const { data, error } = await supabase
      .from('ai_property_recommendations')
      .select(`
        *,
        property:properties(
          id,
          title,
          address,
          price,
          area_sqft,
          bedrooms,
          bathrooms,
          images,
          project:projects(name)
        )
      `)
      .eq('client_id', client.id)
      .order('match_score', { ascending: false })
      .limit(10)

    if (error) throw error
    setAiRecommendations(data || [])
  }

  const fetchAiInsights = async () => {
    const { data, error } = await supabase
      .from('client_ai_insights')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    setAiInsights(data || [])
  }

  const formatPrice = (price) => {
    if (!price) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price / 100)
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'budget_update': return <DollarSign className="h-4 w-4" />
      case 'area_preference': return <MapPin className="h-4 w-4" />
      case 'intent_level': return <TrendingUp className="h-4 w-4" />
      case 'urgency': return <Calendar className="h-4 w-4" />
      case 'property_interest': return <Building2 className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getInsightColor = (type) => {
    switch (type) {
      case 'budget_update': return 'bg-green-100 text-green-800'
      case 'area_preference': return 'bg-blue-100 text-blue-800'
      case 'intent_level': return 'bg-purple-100 text-purple-800'
      case 'urgency': return 'bg-orange-100 text-orange-800'
      case 'property_interest': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-2xl">
                  {client.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {client.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onEdit(client)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              {client.whatsapp_number && (
                <button
                  onClick={() => onWhatsApp(client)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('viewings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'viewings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Viewing Records ({viewingRecords.length})
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recommendations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                AI Recommendations ({aiRecommendations.length})
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                AI Insights ({aiInsights.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Client Information */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <span className="text-sm text-gray-600">Budget Range</span>
                            <div className="font-medium">
                              {formatPrice(client.budget_min)} - {formatPrice(client.budget_max)}
                            </div>
                          </div>
                        </div>
                        
                        {client.preferred_areas && client.preferred_areas.length > 0 && (
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                            <div>
                              <span className="text-sm text-gray-600">Preferred Areas</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {client.preferred_areas.map((area, index) => (
                                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {client.notes && (
                          <div className="flex items-start">
                            <User className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                            <div>
                              <span className="text-sm text-gray-600">Notes</span>
                              <div className="text-gray-900 mt-1">{client.notes}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{viewingRecords.length}</div>
                          <div className="text-sm text-gray-600">Property Viewings</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{aiRecommendations.length}</div>
                          <div className="text-sm text-gray-600">AI Matches</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{aiInsights.length}</div>
                          <div className="text-sm text-gray-600">AI Insights</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {viewingRecords.filter(r => r.rating >= 4).length}
                          </div>
                          <div className="text-sm text-gray-600">High Ratings</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'viewings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Viewing Records</h3>
                    <button
                      onClick={() => setShowViewingForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Viewing</span>
                    </button>
                  </div>

                  {viewingRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No viewing records yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {viewingRecords.map(record => (
                        <div key={record.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{record.property?.title}</h4>
                              <div className="flex items-center text-gray-600 text-sm mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{record.property?.address}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                {new Date(record.viewing_date).toLocaleDateString()}
                              </div>
                              {record.rating && (
                                <div className="flex items-center mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < record.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {record.feedback && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-2">Feedback</h5>
                              <p className="text-gray-700">{record.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Property Recommendations</h3>
                  
                  {aiRecommendations.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No AI recommendations available</p>
                      <p className="text-sm text-gray-500">Recommendations will appear based on client preferences</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {aiRecommendations.map(recommendation => (
                        <div key={recommendation.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{recommendation.property.title}</h4>
                              <div className="flex items-center text-gray-600 text-sm mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{recommendation.property.address}</span>
                              </div>
                              {recommendation.property.project && (
                                <div className="flex items-center text-gray-600 text-sm mt-1">
                                  <Building2 className="h-4 w-4 mr-1" />
                                  <span>{recommendation.property.project.name}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {Math.round(recommendation.match_score * 100)}%
                              </div>
                              <div className="text-xs text-gray-500">Match Score</div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatPrice(recommendation.property.price)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {recommendation.property.area_sqft} sqft • 
                              {recommendation.property.bedrooms} bed • 
                              {recommendation.property.bathrooms} bath
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Match Reasons</h5>
                            <div className="flex flex-wrap gap-2">
                              {recommendation.match_reasons.map((reason, index) => (
                                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'insights' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Insights</h3>
                  
                  {aiInsights.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No AI insights available</p>
                      <p className="text-sm text-gray-500">Insights will be generated from WhatsApp conversations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiInsights.map(insight => (
                        <div key={insight.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-lg ${getInsightColor(insight.insight_type)}`}>
                              {getInsightIcon(insight.insight_type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900 capitalize">
                                  {insight.insight_type.replace('_', ' ')}
                                </h4>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {Math.round(insight.confidence_score * 100)}% confidence
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(insight.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-gray-700">
                                {JSON.stringify(insight.insight_data, null, 2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Viewing Record Form */}
        {showViewingForm && (
          <ViewingRecordForm
            isOpen={showViewingForm}
            onClose={() => {
              setShowViewingForm(false)
              fetchViewingRecords()
            }}
            clientId={client.id}
          />
        )}
      </div>
    </div>
  )
}