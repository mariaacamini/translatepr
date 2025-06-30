import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { SaleorContentType } from '../../types/saleor';
import { saleorService } from '../../services/saleorService';

export const ContentTypeManager: React.FC = () => {
  const [contentTypes, setContentTypes] = useState<SaleorContentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingType, setEditingType] = useState<string | null>(null);

  useEffect(() => {
    loadContentTypes();
  }, []);

  const loadContentTypes = async () => {
    try {
      setIsLoading(true);
      const types = await saleorService.getContentTypes();
      setContentTypes(types);
    } catch (error) {
      console.error('Failed to load content types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContentType = async (typeId: string, enabled: boolean) => {
    try {
      await saleorService.updateContentTypeSettings(typeId, { enabled });
      setContentTypes(types => 
        types.map(type => 
          type.id === typeId ? { ...type, enabled } : type
        )
      );
    } catch (error) {
      console.error('Failed to update content type:', error);
    }
  };

  const updatePriority = async (typeId: string, priority: 'high' | 'medium' | 'low') => {
    try {
      await saleorService.updateContentTypeSettings(typeId, { priority });
      setContentTypes(types => 
        types.map(type => 
          type.id === typeId ? { ...type, priority } : type
        )
      );
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Content Types Configuration</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure which Saleor content types are enabled for translation and set their priorities
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {contentTypes.map((contentType) => (
            <div key={contentType.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={contentType.enabled}
                      onChange={(e) => toggleContentType(contentType.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{contentType.name}</h4>
                    <p className="text-sm text-gray-500">
                      {contentType.fields.length} translatable fields • 
                      ~{contentType.estimatedCharacters} characters per item
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <select
                    value={contentType.priority}
                    onChange={(e) => updatePriority(contentType.id, e.target.value as any)}
                    disabled={!contentType.enabled}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(contentType.priority)}`}>
                    {contentType.priority}
                  </span>

                  <button
                    onClick={() => setEditingType(editingType === contentType.id ? null : contentType.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <CogIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {editingType === contentType.id && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Translatable Fields</h5>
                  <div className="space-y-3">
                    {contentType.fields.map((field, index) => (
                      <div key={index} className="bg-white rounded border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{field.name}</span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {field.type}
                              </span>
                              {field.required && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            {field.maxLength && (
                              <p className="text-xs text-gray-500 mt-1">
                                Max length: {field.maxLength} characters
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {field.preserveFormatting && (
                              <InformationCircleIcon 
                                className="h-4 w-4 text-blue-500" 
                                title="Preserves formatting"
                              />
                            )}
                            {field.validation && field.validation.length > 0 && (
                              <ExclamationTriangleIcon 
                                className="h-4 w-4 text-yellow-500" 
                                title={`${field.validation.length} validation rules`}
                              />
                            )}
                          </div>
                        </div>
                        
                        {field.validation && field.validation.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            <strong>Validation rules:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {field.validation.map((rule, ruleIndex) => (
                                <li key={ruleIndex}>{rule.message}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contentType.lastSync && (
                <div className="mt-4 text-xs text-gray-500">
                  Last synchronized: {new Date(contentType.lastSync).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};