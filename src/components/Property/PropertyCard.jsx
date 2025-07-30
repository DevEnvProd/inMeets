import React from 'react'
import { 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  DollarSign,
  Building2,
  Tag
} from 'lucide-react'

export const PropertyCard = ({ property, onEdit, onDelete }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price / 100)
  }

  const getStatusColor = (status) => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800'
  }

  const defaultImage = 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400'
  const propertyImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : defaultImage

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Property Image */}
      <div className="relative h-48">
        <img
          src={propertyImage}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
            {property.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {property.category?.name || 'Uncategorized'}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h3>
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{property.address}</span>
          </div>
          {property.project && (
            <div className="flex items-center text-gray-600 text-sm">
              <Building2 className="h-4 w-4 mr-1" />
              <span>{property.project.name}</span>
            </div>
          )}
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <Square className="h-4 w-4 mr-1" />
            <span>{property.area_sqft || 0} sqft</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>{formatPrice(property.price)}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Bed className="h-4 w-4 mr-1" />
            <span>{property.bedrooms || 0} bed</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Bath className="h-4 w-4 mr-1" />
            <span>{property.bathrooms || 0} bath</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            By {property.creator?.email?.split('@')[0]}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(property)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Property"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(property.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Property"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}