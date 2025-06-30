import React, { useState, useEffect } from 'react';
import { 
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { TranslationHistory, TranslationMetrics } from '../../types/saleor';
import { getLanguageFlag } from '../../constants/languages';

export const TranslationHistoryView: React.FC = () => {
  const [history, setHistory] = useState<TranslationHistory[]>([]);
  const [metrics, setMetrics] = useState<TranslationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    dateRange: '7d',
    userId: 'all'
  });

  useEffect(() => {
    loadHistory();
    loadMetrics();
  }, [filters]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      // Mock data for demonstration
      const mockHistory: TranslationHistory[] = [
        {
          id: 'hist_1',
          queueItemId: 'queue_1',
          action: 'completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          userId: 'user_1',
          userName: 'John Translator',
          details: 'Product "Wireless Headphones" translation completed for Spanish',
          previousValue: '',
          newValue: 'Auriculares Inalámbricos',
          metadata: {
            contentType: 'product',
            field: 'name',
            characterCount: 22,
            translationTime: 120
          }
        },
        {
          id: 'hist_2',
          queueItemId: 'queue_2',
          action: 'modified',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          userId: 'user_2',
          userName: 'Sarah Editor',
          details: 'Manual correction applied to category description',
          previousValue: 'Dispositifs électroniques',
          newValue: 'Appareils électroniques et accessoires',
          metadata: {
            contentType: 'category',
            field: 'description',
            reason: 'Improved accuracy'
          }
        },
        {
          id: 'hist_3',
          queueItemId: 'queue_3',
          action: 'failed',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          details: 'Translation failed due to API rate limit',
          metadata: {
            error: 'Rate limit exceeded',
            retryScheduled: true
          }
        }
      ];
      setHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const mockMetrics: TranslationMetrics = {
        totalItems: 1247,
        completedItems: 1156,
        failedItems: 23,
        averageCompletionTime: 4.2,
        successRate: 92.7,
        charactersThroughput: 15678,
        translatorPerformance: {
          'user_1': {
            completed: 456,
            averageTime: 3.8,
            accuracy: 94.2
          },
          'user_2': {
            completed: 234,
            averageTime: 5.1,
            accuracy: 97.8
          }
        }
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'completed': return CheckCircleIcon;
      case 'failed': return XCircleIcon;
      case 'modified': return PencilIcon;
      case 'created': return DocumentTextIcon;
      case 'started': return ClockIcon;
      default: return EyeIcon;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'modified': return 'text-blue-600 bg-blue-100';
      case 'created': return 'text-purple-600 bg-purple-100';
      case 'started': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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
      {/* Metrics Overview */}
      {metrics && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics.averageCompletionTime.toFixed(1)}m</div>
              <div className="text-sm text-gray-500">Avg. Completion Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{metrics.charactersThroughput.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Characters/Day</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{Object.keys(metrics.translatorPerformance).length}</div>
              <div className="text-sm text-gray-500">Active Translators</div>
            </div>
          </div>

          {/* Translator Performance */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Translator Performance</h4>
            <div className="space-y-3">
              {Object.entries(metrics.translatorPerformance).map(([userId, performance]) => (
                <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium">{userId}</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <span className="ml-1 font-medium">{performance.completed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg. Time:</span>
                      <span className="ml-1 font-medium">{performance.averageTime.toFixed(1)}m</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Accuracy:</span>
                      <span className="ml-1 font-medium text-green-600">{performance.accuracy.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="started">Started</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="modified">Modified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <select
            value={filters.userId}
            onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Users</option>
            <option value="user_1">John Translator</option>
            <option value="user_2">Sarah Editor</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* History Timeline */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Translation History</h3>
        </div>

        <div className="flow-root p-6">
          <ul role="list" className="-mb-8">
            {history.map((item, itemIdx) => {
              const ActionIcon = getActionIcon(item.action);
              const actionColor = getActionColor(item.action);
              
              return (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {itemIdx !== history.length - 1 ? (
                      <span
                        className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className={`relative px-1`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${actionColor}`}>
                          <ActionIcon className="h-4 w-4" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.details}
                            </p>
                            {item.userName && (
                              <p className="text-sm text-gray-500">
                                by {item.userName}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                        
                        {(item.previousValue || item.newValue) && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3">
                            {item.previousValue && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-gray-500">Previous:</span>
                                <p className="text-sm text-gray-700 mt-1">{item.previousValue}</p>
                              </div>
                            )}
                            {item.newValue && (
                              <div>
                                <span className="text-xs font-medium text-gray-500">New:</span>
                                <p className="text-sm text-gray-900 mt-1">{item.newValue}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {item.metadata && (
                          <div className="mt-2 text-xs text-gray-500">
                            {item.metadata.contentType && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                                {item.metadata.contentType}
                              </span>
                            )}
                            {item.metadata.field && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                                {item.metadata.field}
                              </span>
                            )}
                            {item.metadata.characterCount && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                                {item.metadata.characterCount} chars
                              </span>
                            )}
                            {item.metadata.translationTime && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                                {Math.round(item.metadata.translationTime / 60)}m
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};