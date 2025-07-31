import React, { useState, useEffect } from 'react'
import { X, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export const ViewingRecordForm = ({ isOpen, onClose, clientId, record }) => {
  const { organization, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState([])
  const [formData, setFormData] = useState({
    property_id: '',
    viewing_date: '',
    location: '',
    feedback: '',
    rating: 0
  })

  useEffect(() => {
    if (isOpen) {
      fetchProperties()
    }
  }, [isOpen])

  useEffect(() => {
    if (record) {
      setFormData({
        property_id: record.property_id || '',
        viewing_date: record.viewing_date ? new Date(record.viewing_date).toISOString().slice(0, 16) : '',
        location: record.location || '',
        feedback: record.feedback || '',
        rating: record.rating || 0
      })
    } else {
      setFormData({
        property_id: '',
        viewing_date: '',
        location: '',
        feedback: '',
        rating: 0
      })
    }
  }, [record])

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, project:projects(name)')
        .eq('organization_id', organization.id)
        .eq('status', 'published')
        .order('title')

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const recordData = {
        ...formData,
        client_id: clientId,
        viewing_date: new Date(formData.viewing_date).toISOString(),
        organization_id: organization.id,
        created_by: user.id
      }

      if (record) {
        // Update existing record
        const { error } = await supabase
          .from('client_viewing_records')
          .update(recordData)
          .eq('id', record.id)

        if (error) throw error
      } else {
        // Create new record
        const { error } = await supabase
          .from('client_viewing_records')
          .insert([recordData])

        if (error) throw error
      }

      onClose()
    } catch (error) {
      console.error('Error saving viewing record:', error)
      alert('Error saving viewing record: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {record ? 'Edit Viewing Record' : 'Add Viewing Record'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property *
              </label>
              <select
                required
                value={formData.property_id}
                onChange={(e) => handleInputChange('property_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.title} - {property.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Viewing Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.viewing_date}
                onChange={(e) => handleInputChange('viewing_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter meeting location (e.g., Property lobby, Coffee shop)"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Rating
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(rating)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {formData.rating > 0 ? `${formData.rating}/5` : 'No rating'}
              </span>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Feedback
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => handleInputChange('feedback', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter client's feedback about the property viewing"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : record ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}