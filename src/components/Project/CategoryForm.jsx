import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export const CategoryForm = ({ isOpen, onClose, category }) => {
  const { organization, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || ''
      })
    } else {
      setFormData({
        name: '',
        description: ''
      })
    }
  }, [category])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoryData = {
        ...formData,
        organization_id: organization.id,
        created_by: user.id
      }

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('property_categories')
          .update(categoryData)
          .eq('id', category.id)

        if (error) throw error

        // Log the update
        await supabase
          .from('property_activity_logs')
          .insert([{
            organization_id: organization.id,
            user_id: user.id,
            action: 'update',
            entity_type: 'category',
            entity_id: category.id,
            description: `Updated category: ${formData.name}`,
            data_after: categoryData
          }])
      } else {
        // Create new category
        const { data: newCategory, error } = await supabase
          .from('property_categories')
          .insert([categoryData])
          .select()
          .single()

        if (error) throw error

        // Log the creation
        await supabase
          .from('property_activity_logs')
          .insert([{
            organization_id: organization.id,
            user_id: user.id,
            action: 'create',
            entity_type: 'category',
            entity_id: newCategory.id,
            description: `Created category: ${formData.name}`,
            data_after: categoryData
          }])
      }

      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error saving category: ' + error.message)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {category ? 'Edit Category' : 'Add New Category'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category name (e.g., 新房, 二手房, 拍卖房, 出租房)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category description"
            />
          </div>

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
              {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}