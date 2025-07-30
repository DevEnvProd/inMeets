import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  MapPin
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ProjectForm } from '../components/Project/ProjectForm'
import { CategoryForm } from '../components/Project/CategoryForm'

export const ProjectManagement = () => {
  const { organization, user } = useAuth()
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [activeTab, setActiveTab] = useState('projects')

  useEffect(() => {
    if (organization) {
      fetchData()
    }
  }, [organization])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchProjects(),
        fetchCategories()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        property_count:properties(count)
      `)
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    setProjects(data || [])
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('property_categories')
      .select(`
        *,
        property_count:properties(count)
      `)
      .eq('organization_id', organization.id)
      .order('name')

    if (error) throw error
    setCategories(data || [])
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also remove it from all associated properties.')) return

    try {
      // Log the deletion
      await supabase
        .from('property_activity_logs')
        .insert([{
          organization_id: organization.id,
          user_id: user.id,
          action: 'delete',
          entity_type: 'project',
          entity_id: projectId,
          description: 'Deleted project'
        }])

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error deleting project')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also remove it from all associated properties.')) return

    try {
      // Log the deletion
      await supabase
        .from('property_activity_logs')
        .insert([{
          organization_id: organization.id,
          user_id: user.id,
          action: 'delete',
          entity_type: 'category',
          entity_id: categoryId,
          description: 'Deleted property category'
        }])

      const { error } = await supabase
        .from('property_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const handleEditProject = (project) => {
    setEditingProject(project)
    setShowProjectForm(true)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleFormClose = () => {
    setShowProjectForm(false)
    setShowCategoryForm(false)
    setEditingProject(null)
    setEditingCategory(null)
    fetchData()
  }

  const filteredProjects = projects.filter(project =>
    !searchTerm || 
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.developer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCategories = categories.filter(category =>
    !searchTerm || 
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project & Category Management</h1>
          <p className="text-gray-600">Manage your real estate projects and property categories</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categories ({categories.length})
              </button>
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => activeTab === 'projects' ? setShowProjectForm(true) : setShowCategoryForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add {activeTab === 'projects' ? 'Project' : 'Category'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'projects' ? (
          <div className="bg-white rounded-lg border border-gray-200">
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first project'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowProjectForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Developer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Properties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-500">{project.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.developer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {project.location || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.property_count?.[0]?.count || 0} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditProject(project)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Project"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            {filteredCategories.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first category'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowCategoryForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Category
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {category.description && (
                      <p className="text-gray-600 mb-4">{category.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{category.property_count?.[0]?.count || 0} properties</span>
                      <span>by {category.creator?.email?.split('@')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Forms */}
        {showProjectForm && (
          <ProjectForm
            isOpen={showProjectForm}
            onClose={handleFormClose}
            project={editingProject}
          />
        )}

        {showCategoryForm && (
          <CategoryForm
            isOpen={showCategoryForm}
            onClose={handleFormClose}
            category={editingCategory}
          />
        )}
      </div>
    </div>
  )
}