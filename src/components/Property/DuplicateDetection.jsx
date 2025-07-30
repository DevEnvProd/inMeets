import React, { useState } from 'react'
import { AlertTriangle, Merge, X, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const DuplicateDetection = ({ duplicates, onMerge }) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [merging, setMerging] = useState(false)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price / 100)
  }

  const handleMergeProperties = async (keepPropertyId, duplicateIds) => {
    setMerging(true)
    try {
      // Delete duplicate properties
      const { error } = await supabase
        .from('properties')
        .delete()
        .in('id', duplicateIds)

      if (error) throw error

      setShowModal(false)
      setSelectedGroup(null)
      onMerge()
      alert('Properties merged successfully!')
    } catch (error) {
      console.error('Error merging properties:', error)
      alert('Error merging properties: ' + error.message)
    } finally {
      setMerging(false)
    }
  }

  const openMergeModal = (group) => {
    setSelectedGroup(group)
    setShowModal(true)
  }

  return (
    <>
      {/* Duplicate Groups Summary */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Potential Duplicates</h3>
        </div>
        
        <div className="space-y-4">
          {duplicates.map((group, groupIndex) => (
            <div key={groupIndex} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Duplicate Group {groupIndex + 1} ({group.length} properties)
                  </h4>
                  <p className="text-sm text-gray-600">
                    Similar address, area, and price detected
                  </p>
                </div>
                <button
                  onClick={() => openMergeModal(group)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                >
                  <Merge className="h-4 w-4" />
                  <span>Review & Merge</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.map((property) => (
                  <div key={property.id} className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium text-gray-900">{property.title}</div>
                    <div className="text-xs text-gray-600">{property.address}</div>
                    <div className="text-xs text-gray-600">
                      {property.area_sqft} sqft • {formatPrice(property.price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Merge Modal */}
      {showModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Merge Duplicate Properties</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Select which property to keep and which ones to remove. The kept property will remain unchanged.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedGroup.map((property, index) => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">Property {index + 1}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const otherIds = selectedGroup
                              .filter(p => p.id !== property.id)
                              .map(p => p.id)
                            handleMergeProperties(property.id, otherIds)
                          }}
                          disabled={merging}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Keep This
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> {property.title}</div>
                      <div><strong>Address:</strong> {property.address}</div>
                      <div><strong>Area:</strong> {property.area_sqft} sqft</div>
                      <div><strong>Price:</strong> {formatPrice(property.price)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Warning</h4>
                    <p className="text-yellow-700 text-sm">
                      This action cannot be undone. The properties you don't keep will be permanently deleted.
                      Make sure to review all details before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}