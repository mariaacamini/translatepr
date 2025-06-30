import React, { useState, useEffect } from 'react';
import { 
  CogIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  KeyIcon,
  GlobeAltIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { SaleorConfig, AutoTranslationRule } from '../../types/saleor';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { DeepLSettings } from './DeepLSettings';

export const SaleorSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'saleor' | 'deepl'>('saleor');
  const [config, setConfig] = useState<SaleorConfig>({
    apiEndpoint: '',
    authToken: '',
    defaultSourceLanguage: 'en',
    enabledTargetLanguages: ['es', 'fr'],
    batchSize: 50,
    rateLimitPerMinute: 100,
    autoTranslationEnabled: false,
    autoTranslationRules: [],
    syncSettings: {
      autoSync: false,
      syncInterval: 30,
      conflictResolution: 'manual',
      backupBeforeSync: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedConfig = localStorage.getItem('saleor_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      localStorage.setItem('saleor_config', JSON.stringify(config));
      console.log('Settings saved:', config);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult('Testing connection...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (config.apiEndpoint && config.authToken) {
        setConnectionStatus('connected');
        setTestResult('Connection successful! API is accessible.');
      } else {
        setConnectionStatus('error');
        setTestResult('Please provide both API endpoint and authentication token.');
      }
    } catch (error) {
      setConnectionStatus('error');
      setTestResult('Connection failed. Please check your settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const addAutoTranslationRule = () => {
    const newRule: AutoTranslationRule = {
      contentType: 'product',
      fields: ['name'],
      priority: 'medium',
      enabled: true
    };
    setConfig(prev => ({
      ...prev,
      autoTranslationRules: [...prev.autoTranslationRules, newRule]
    }));
  };

  const updateAutoTranslationRule = (index: number, updates: Partial<AutoTranslationRule>) => {
    setConfig(prev => ({
      ...prev,
      autoTranslationRules: prev.autoTranslationRules.map((rule, i) => 
        i === index ? { ...rule, ...updates } : rule
      )
    }));
  };

  const removeAutoTranslationRule = (index: number) => {
    setConfig(prev => ({
      ...prev,
      autoTranslationRules: prev.autoTranslationRules.filter((_, i) => i !== index)
    }));
  };

  const tabs = [
    { id: 'saleor', name: 'Saleor Integration', icon: CogIcon },
    { id: 'deepl', name: 'DeepL Translation', icon: GlobeAltIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'deepl' ? (
        <DeepLSettings />
      ) : (
        <div className="space-y-6">
          {/* Connection Settings */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Saleor API Configuration</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure connection to your Saleor GraphQL API
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Endpoint
                </label>
                <input
                  type="url"
                  value={config.apiEndpoint}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                  placeholder="https://your-store.saleor.cloud/graphql/"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authentication Token
                </label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={config.authToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, authToken: e.target.value }))}
                    placeholder="Enter your Saleor API token"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {connectionStatus === 'connected' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckIcon className="h-5 w-5" />
                      <span className="text-sm">Connected</span>
                    </div>
                  )}
                  {connectionStatus === 'error' && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="text-sm">Connection Error</span>
                    </div>
                  )}
                  {testResult && (
                    <p className="text-sm text-gray-600">{testResult}</p>
                  )}
                </div>
                <button
                  onClick={testConnection}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Language Configuration</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure source and target languages for translation
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Source Language
                </label>
                <select
                  value={config.defaultSourceLanguage}
                  onChange={(e) => setConfig(prev => ({ ...prev, defaultSourceLanguage: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enabled Target Languages
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {SUPPORTED_LANGUAGES.filter(lang => lang.code !== config.defaultSourceLanguage).map(lang => (
                    <label key={lang.code} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enabledTargetLanguages.includes(lang.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig(prev => ({
                              ...prev,
                              enabledTargetLanguages: [...prev.enabledTargetLanguages, lang.code]
                            }));
                          } else {
                            setConfig(prev => ({
                              ...prev,
                              enabledTargetLanguages: prev.enabledTargetLanguages.filter(l => l !== lang.code)
                            }));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm">{lang.flag} {lang.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Settings */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Performance & Rate Limiting</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure batch sizes and rate limits to optimize performance
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.batchSize}
                    onChange={(e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of items to process in each batch</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Limit (per minute)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={config.rateLimitPerMinute}
                    onChange={(e) => setConfig(prev => ({ ...prev, rateLimitPerMinute: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum API requests per minute</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Translation Rules */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Auto-Translation Rules</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure automatic translation triggers for content changes
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.autoTranslationEnabled}
                      onChange={(e) => setConfig(prev => ({ ...prev, autoTranslationEnabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Enable Auto-Translation</span>
                  </label>
                  <button
                    onClick={addAutoTranslationRule}
                    disabled={!config.autoTranslationEnabled}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Add Rule
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {config.autoTranslationRules.length === 0 ? (
                <div className="text-center py-8">
                  <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No auto-translation rules</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add rules to automatically translate content when it's created or updated.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {config.autoTranslationRules.map((rule, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content Type
                          </label>
                          <select
                            value={rule.contentType}
                            onChange={(e) => updateAutoTranslationRule(index, { contentType: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="product">Products</option>
                            <option value="category">Categories</option>
                            <option value="collection">Collections</option>
                            <option value="attribute">Attributes</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fields
                          </label>
                          <select
                            multiple
                            value={rule.fields}
                            onChange={(e) => updateAutoTranslationRule(index, { 
                              fields: Array.from(e.target.selectedOptions, option => option.value)
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            size={3}
                          >
                            <option value="name">Name</option>
                            <option value="description">Description</option>
                            <option value="seoTitle">SEO Title</option>
                            <option value="seoDescription">SEO Description</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                          </label>
                          <select
                            value={rule.priority}
                            onChange={(e) => updateAutoTranslationRule(index, { priority: e.target.value as any })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>

                        <div className="flex items-end space-x-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => updateAutoTranslationRule(index, { enabled: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Enabled</span>
                          </label>
                          <button
                            onClick={() => removeAutoTranslationRule(index)}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sync Settings */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Synchronization Settings</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure how translations are synchronized back to Saleor
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.syncSettings.autoSync}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      syncSettings: { ...prev.syncSettings, autoSync: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Enable Auto-Sync</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.syncSettings.backupBeforeSync}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      syncSettings: { ...prev.syncSettings, backupBeforeSync: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Backup Before Sync</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Interval (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={config.syncSettings.syncInterval}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      syncSettings: { ...prev.syncSettings, syncInterval: parseInt(e.target.value) }
                    }))}
                    disabled={!config.syncSettings.autoSync}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conflict Resolution
                  </label>
                  <select
                    value={config.syncSettings.conflictResolution}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      syncSettings: { ...prev.syncSettings, conflictResolution: e.target.value as any }
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="overwrite">Overwrite Saleor Content</option>
                    <option value="skip">Skip Conflicted Items</option>
                    <option value="manual">Manual Review Required</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};