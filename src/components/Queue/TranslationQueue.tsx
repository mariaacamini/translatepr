import React, { useState, useEffect } from 'react';
import { 
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { TranslationQueueItem } from '../../types/saleor';
import { saleorService } from '../../services/saleorService';
import { getLanguageFlag, getLanguageName } from '../../constants/languages';

interface QueueFilters {
  status: string;
  contentType: string;
  priority: string;
  targetLanguage: string;
  search: string;
  sortBy: 'createdAt' | 'priority' | 'characterCount' | 'estimatedTime';
  sortOrder: 'asc' | 'desc';
}

export const TranslationQueue: React.FC = () => {
  const [queueItems, setQueueItems] = useState<TranslationQueueItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<TranslationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<QueueFilters>({
    status: 'all',
    contentType: 'all',
    priority: 'all',
    targetLanguage: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQueueItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [queueItems, filters]);

  const loadQueueItems = async () => {
    try {
      setIsLoading(true);
      // Mock data for demonstration
      const mockItems: TranslationQueueItem[] = [
        {
          id: 'queue_1',
          contentType: 'product',
          entityId: 'prod_1',
          entityName: 'Wireless Headphones',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          fields: [
            { name: 'name', sourceText: 'Wireless Headphones', characterCount: 18, status: 'pending' },
            { name: 'description', sourceText: 'High-quality wireless headphones with noise cancellation', characterCount: 62, status: 'pending' }
          ],
          status: 'pending',
          priority: 'high',
          characterCount: 80,
          estimatedTime: 2,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          retryCount: 0,
          maxRetries: 3
        },
        {
          id: 'queue_2',
          contentType: 'category',
          entityId: 'cat_1',
          entityName: 'Electronics',
          sourceLanguage: 'en',
          targetLanguage: 'fr',
          fields: [
            { name: 'name', sourceText: 'Electronics', characterCount: 11, status: 'completed', translatedText: 'Électronique' },
            { name: 'description', sourceText: 'Electronic devices and accessories', characterCount: 35, status: 'in-progress' }
          ],
          status: 'in-progress',
          priority: 'medium',
          characterCount: 46,
          estimatedTime: 1,
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          assignedTo: 'translator_1',
          retryCount: 0,
          maxRetries: 3
        }
      ];
      setQueueItems(mockItems);
    } catch (error) {
      console.error('Failed to load queue items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...queueItems];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.contentType !== 'all') {
      filtered = filtered.filter(item => item.contentType === filters.contentType);
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }
    if (filters.targetLanguage !== 'all') {
      filtered = filtered.filter(item => item.targetLanguage === filters.targetLanguage);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.entityName.toLowerCase().includes(searchLower) ||
        item.fields.some(field => field.sourceText.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy];
      let bValue: any = b[filters.sortBy];

      if (filters.sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'failed': return ExclamationCircleIcon;
      case 'in-progress': return PlayIcon;
      default: return ClockIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleBulkAction = async (action: 'start' | 'pause' | 'retry') => {
    console.log(`Bulk ${action} for items:`, Array.from(selectedItems));
    // Implementation for bulk actions
  };

  const crawlContent = async () => {
    try {
      setIsLoading(true);
      // Crawl for new content requiring translation
      const newItems = await saleorService.crawlContent('product', 'es');
      setQueueItems(prev => [...prev, ...newItems]);
    } catch (error) {
      console.error('Failed to crawl content:', error);
    } finally {
      setIsLoading(false);
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
      {/* Queue Statistics */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Translation Queue Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{queueItems.filter(i => i.status === 'pending').length}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{queueItems.filter(i => i.status === 'in-progress').length}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{queueItems.filter(i => i.status === 'completed').length}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{queueItems.filter(i => i.status === 'failed').length}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{queueItems.reduce((sum, item) => sum + item.characterCount, 0)}</div>
            <div className="text-sm text-gray-500">Total Characters</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="review">Review</option>
            </select>

            <select
              value={filters.contentType}
              onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="product">Products</option>
              <option value="category">Categories</option>
              <option value="collection">Collections</option>
              <option value="attribute">Attributes</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={crawlContent}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Crawl Content</span>
            </button>

            {selectedItems.size > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('start')}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Start Selected
                </button>
                <button
                  onClick={() => handleBulkAction('pause')}
                  className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Pause Selected
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Translation Items ({filteredItems.length})
            </h3>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
                }}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
                <option value="priority_desc">High Priority First</option>
                <option value="characterCount_desc">Most Characters</option>
                <option value="estimatedTime_asc">Shortest Time</option>
              </select>
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items in queue</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status !== 'all' ? 'No items match your filters.' : 'Crawl content to populate the translation queue.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => {
              const StatusIcon = getStatusIcon(item.status);
              const statusColor = getStatusColor(item.status);
              const priorityColor = getPriorityColor(item.priority);
              
              return (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems);
                          if (e.target.checked) {
                            newSelected.add(item.id);
                          } else {
                            newSelected.delete(item.id);
                          }
                          setSelectedItems(newSelected);
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${statusColor}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.entityName}
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {item.contentType}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${priorityColor}`}>
                            {item.priority}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{getLanguageFlag(item.sourceLanguage)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-lg">{getLanguageFlag(item.targetLanguage)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Fields to translate:</div>
                            <div className="space-y-1">
                              {item.fields.map((field, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                  <span className="font-medium">{field.name}</span>
                                  <span className={`px-2 py-1 rounded ${getStatusColor(field.status)}`}>
                                    {field.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Statistics:</div>
                            <div className="space-y-1 text-xs">
                              <div>Characters: {item.characterCount}</div>
                              <div>Est. time: {item.estimatedTime} min</div>
                              {item.retryCount > 0 && (
                                <div className="text-red-600">Retries: {item.retryCount}/{item.maxRetries}</div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Timeline:</div>
                            <div className="space-y-1 text-xs">
                              <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                              <div>Updated: {new Date(item.updatedAt).toLocaleDateString()}</div>
                              {item.completedAt && (
                                <div>Completed: {new Date(item.completedAt).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {item.assignedTo && (
                          <div className="mt-2 text-xs text-gray-500">
                            Assigned to: {item.assignedTo}
                          </div>
                        )}
                        
                        {item.errorMessage && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            Error: {item.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.status === 'pending' && (
                        <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors">
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                      {item.status === 'in-progress' && (
                        <button className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-md transition-colors">
                          <PauseIcon className="h-4 w-4" />
                        </button>
                      )}
                      {item.status === 'failed' && (
                        <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors">
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};