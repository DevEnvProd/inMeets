import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export const ProjectForm = ({ isOpen, onClose, project }) => {
  const { organization, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    developer: '',
    location: '',
    description: '',
    completion_date: '',
    total_units: ''
  })

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        developer: project.developer || '',
        location: project.location || '',
        description: project.description || '',
        completion_date: project.completion_date || '',
        total_units: project.total_units || ''
      })
    } else {
      setFormData({
        name: '',
        developer: '',
        location: '',
        description: '',
        completion_date: '',
        total_units: ''
      })
    }
  }, [project])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const projectData = {
        ...formData,
        total_units: parseInt(formData.total_units) || null,
        organization_id: organization.id,
        created_by: user.id
      }

      if (project) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)

        if (error) throw error

        // Log the update
        await supabase
          .from('property_activity_logs')
          .insert([{
            organization_id: organization.id,
            user_id: user.id,
            action: 'update',
            entity_type: 'project',
            entity_id: project.id,
            description: `Updated project: ${formData.name}`,
            data_after: projectData
          }])
      } else {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert([projectData])
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
            entity_type: 'project',
            entity_id: newProject.id,
            description: `Created project: ${formData.name}`,
            data_after: projectData
          }])
      }

      onClose()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Error saving project: ' + error.message)
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {project ? 'Edit Project' : 'Add New Project'}
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
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Developer *
              </label>
              <input
                type="text"
                required
                value={formData.developer}
                onChange={(e) => handleInputChange('developer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter developer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Units
              </label>
              <input
                type="number"
                min="0"
                value={formData.total_units}
                onChange={(e) => handleInputChange('total_units', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter total number of units"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Date
              </label>
              <input
                type="date"
                value={formData.completion_date}
                onChange={(e) => handleInputChange('completion_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project description"
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
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}