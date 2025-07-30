import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  AlertTriangle,
  Merge
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { PropertyForm } from '../components/Property/PropertyForm'
import { PropertyCard } from '../components/Property/PropertyCard'
import { PropertyTable } from '../components/Property/PropertyTable'
import { DuplicateDetection } from '../components/Property/DuplicateDetection'

export const Properties = () => {
  const { organization } = useAuth()
  const [properties, setProperties] = useState([])
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [duplicates, setDuplicates] = useState([])

  useEffect(() => {
    if (organization) {
      fetchData()
    }
  }, [organization])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchProperties(),
        fetchProjects(),
        fetchCategories(),
        detectDuplicates()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        *,
        project:projects(name, developer),
        category:property_categories(name)
      `)
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Then manually fetch emails for each unique creator_id (if needed)
    const creatorIds = [...new Set(properties.map(p => p.creator_id))];
    // Use admin API or your own backend function to look up auth.users
    
    setProperties(properties || []);

  }

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organization.id)
      .order('name')

    if (error) throw error
    setProjects(data || [])
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('property_categories')
      .select('*')
      .eq('organization_id', organization.id)
      .order('name')

    if (error) throw error
    setCategories(data || [])
  }

  const detectDuplicates = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, address, area_sqft, price')
      .eq('organization_id', organization.id)

    if (error) return

    const duplicateGroups = []
    const processed = new Set()

    data.forEach((property, index) => {
      if (processed.has(property.id)) return

      const potentialDuplicates = data.filter((other, otherIndex) => {
        if (otherIndex <= index || processed.has(other.id)) return false
        
        const addressMatch = property.address?.toLowerCase() === other.address?.toLowerCase()
        const areaMatch = Math.abs((property.area_sqft || 0) - (other.area_sqft || 0)) <= 50
        const priceMatch = Math.abs((property.price || 0) - (other.price || 0)) <= 10000

        return addressMatch && areaMatch && priceMatch
      })

      if (potentialDuplicates.length > 0) {
        const group = [property, ...potentialDuplicates]
        duplicateGroups.push(group)
        group.forEach(p => processed.add(p.id))
      }
    })

    setDuplicates(duplicateGroups)
  }

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting property:', error)
      alert('Error deleting property')
    }
  }

  const handleEditProperty = (property) => {
    setEditingProperty(property)
    setShowPropertyForm(true)
  }

  const handleFormClose = () => {
    setShowPropertyForm(false)
    setEditingProperty(null)
    fetchData()
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch = !searchTerm || 
      property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || property.category_id === selectedCategory
    const matchesProject = !selectedProject || property.project_id === selectedProject

    return matchesSearch && matchesCategory && matchesProject
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
              <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
              <p className="text-gray-600">Manage your property portfolio</p>
            </div>
            <button
              onClick={() => setShowPropertyForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Property</span>
            </button>
          </div>

          {/* Duplicate Detection Alert */}
          {duplicates.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {duplicates.length} potential duplicate group(s) detected
                </span>
                <button className="text-yellow-600 hover:text-yellow-700 text-sm underline">
                  Review duplicates
                </button>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Display */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory || selectedProject 
                ? 'Try adjusting your filters or search terms'
                : 'Get started by adding your first property'
              }
            </p>
            {!searchTerm && !selectedCategory && !selectedProject && (
              <button
                onClick={() => setShowPropertyForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Property
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
              />
            ))}
          </div>
        ) : (
          <PropertyTable
            properties={filteredProperties}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
          />
        )}

        {/* Duplicate Detection Component */}
        {duplicates.length > 0 && (
          <DuplicateDetection
            duplicates={duplicates}
            onMerge={fetchData}
          />
        )}

        {/* Property Form Modal */}
        {showPropertyForm && (
          <PropertyForm
            isOpen={showPropertyForm}
            onClose={handleFormClose}
            property={editingProperty}
            projects={projects}
            categories={categories}
          />
        )}
      </div>
    </div>
  )
}