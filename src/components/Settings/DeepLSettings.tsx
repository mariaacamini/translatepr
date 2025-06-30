import React, { useState, useEffect } from 'react';
import { 
  KeyIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DatabaseIcon
} from '@heroicons/react/24/outline';
import { DeepLConfig, DeepLLanguage, TranslationStatistics } from '../../types/deepl';
import { getDeepLService, initializeDeepLService } from '../../services/deeplService';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';

export const DeepLSettings: React.FC = () => {
  const [config, setConfig] = useState<DeepLConfig>({
    apiKey: '',
    apiEndpoint: 'https://api-free.deepl.com',
    defaultSourceLanguage: 'en',
    defaultTargetLanguage: 'es',
    maxRetries: 3,
    retryDelay: 1000,
    batchSize: 50,
    preserveFormatting: true,
    formalityLevel: 'default'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [testResult, setTestResult] = useState<string>('');
  const [supportedLanguages, setSupportedLanguages] = useState<{ source: DeepLLanguage[]; target: DeepLLanguage[] } | null>(null);
  const [statistics, setStatistics] = useState<TranslationStatistics | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedConfig = localStorage.getItem('deepl_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        
        if (parsed.apiKey) {
          await testConnection(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load DeepL settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      localStorage.setItem('deepl_config', JSON.stringify(config));
      
      // Initialize DeepL service with new config
      if (config.apiKey) {
        initializeDeepLService(config);
        await testConnection(config);
      }
      
      setTestResult('Settings saved successfully!');
    } catch (error) {
      setTestResult('Failed to save settings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (testConfig?: DeepLConfig) => {
    const configToTest = testConfig || config;
    
    if (!configToTest.apiKey) {
      setConnectionStatus('error');
      setTestResult('API key is required');
      return;
    }

    try {
      setIsLoading(true);
      setTestResult('Testing connection...');
      
      const service = initializeDeepLService(configToTest);
      
      // Test with a simple translation
      const result = await service.translateText(['Hello'], 'ES', 'EN');
      
      if (result && result.length > 0) {
        setConnectionStatus('connected');
        setTestResult('Connection successful! API is working correctly.');
        
        // Load supported languages and statistics
        await loadSupportedLanguages(service);
        await loadStatistics(service);
      } else {
        setConnectionStatus('error');
        setTestResult('Connection test failed: No translation result received');
      }
    } catch (error) {
      setConnectionStatus('error');
      setTestResult('Connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupportedLanguages = async (service: any) => {
    try {
      const languages = await service.getSupportedLanguages();
      setSupportedLanguages(languages);
    } catch (error) {
      console.error('Failed to load supported languages:', error);
    }
  };

  const loadStatistics = async (service: any) => {
    try {
      const stats = await service.getTranslationStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const clearTranslationMemory = async () => {
    try {
      if (config.apiKey) {
        const service = getDeepLService();
        await service.clearTranslationMemory();
        setTestResult('Translation memory cleared successfully');
        await loadStatistics(service);
      }
    } catch (error) {
      setTestResult('Failed to clear translation memory: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const exportTranslationMemory = async () => {
    try {
      if (config.apiKey) {
        const service = getDeepLService();
        const entries = await service.exportTranslationMemory();
        
        const dataStr = JSON.stringify(entries, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `translation-memory-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        setTestResult('Translation memory exported successfully');
      }
    } catch (error) {
      setTestResult('Failed to export translation memory: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">DeepL API Configuration</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure your DeepL API integration for automated translations
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key *
            </label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your DeepL API key"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from the <a href="https://www.deepl.com/account/summary" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">DeepL Account page</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint
            </label>
            <select
              value={config.apiEndpoint}
              onChange={(e) => setConfig(prev => ({ ...prev, apiEndpoint: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="https://api-free.deepl.com">Free API (api-free.deepl.com)</option>
              <option value="https://api.deepl.com">Pro API (api.deepl.com)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Source Language
              </label>
              <select
                value={config.defaultSourceLanguage}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultSourceLanguage: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="auto">Auto-detect</option>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Target Language
              </label>
              <select
                value={config.defaultTargetLanguage}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultTargetLanguage: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {connectionStatus === 'connected' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => testConnection()}
                disabled={isLoading || !config.apiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={saveSettings}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure advanced translation options and behavior
              </p>
            </div>
            <ArrowPathIcon className={`h-5 w-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showAdvanced && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Retries
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={config.maxRetries}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retry Delay (ms)
                </label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={config.retryDelay}
                  onChange={(e) => setConfig(prev => ({ ...prev, retryDelay: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formality Level
                </label>
                <select
                  value={config.formalityLevel}
                  onChange={(e) => setConfig(prev => ({ ...prev, formalityLevel: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="more">More formal</option>
                  <option value="less">Less formal</option>
                  <option value="prefer_more">Prefer more formal</option>
                  <option value="prefer_less">Prefer less formal</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.preserveFormatting}
                    onChange={(e) => setConfig(prev => ({ ...prev, preserveFormatting: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Preserve Formatting</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Usage Statistics</h3>
            <p className="text-sm text-gray-500 mt-1">
              Monitor your DeepL API usage and translation performance
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{statistics.totalTranslations}</div>
                <div className="text-sm text-gray-500">Total Translations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{statistics.charactersTranslated.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Characters Translated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{statistics.charactersRemaining.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Characters Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{statistics.cacheHitRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Cache Hit Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Language Pairs</h4>
                <div className="space-y-2">
                  {Object.entries(statistics.languageDistribution).slice(0, 5).map(([pair, count]) => (
                    <div key={pair} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{pair.replace('-', ' → ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-medium text-green-600">{statistics.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg. Translation Time</span>
                    <span className="font-medium">{statistics.averageTranslationTime.toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Translation Memory Management */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Translation Memory</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage cached translations to improve performance and reduce API usage
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <DatabaseIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {statistics ? `${statistics.totalTranslations} entries cached` : 'No cache data available'}
                </span>
              </div>
              {statistics && (
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {statistics.cacheHitRate.toFixed(1)}% cache hit rate
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={exportTranslationMemory}
                disabled={!config.apiKey}
                className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                Export
              </button>
              <button
                onClick={clearTranslationMemory}
                disabled={!config.apiKey}
                className="px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Languages */}
      {supportedLanguages && (
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Supported Languages</h3>
            <p className="text-sm text-gray-500 mt-1">
              Languages available for translation via DeepL API
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Source Languages ({supportedLanguages.source.length})</h4>
                <div className="grid grid-cols-2 gap-2">
                  {supportedLanguages.source.map(lang => (
                    <div key={lang.language} className="text-sm text-gray-600">
                      {lang.name} ({lang.language})
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Target Languages ({supportedLanguages.target.length})</h4>
                <div className="grid grid-cols-2 gap-2">
                  {supportedLanguages.target.map(lang => (
                    <div key={lang.language} className="flex items-center justify-between text-sm text-gray-600">
                      <span>{lang.name} ({lang.language})</span>
                      {lang.supports_formality && (
                        <InformationCircleIcon className="h-4 w-4 text-blue-500" title="Supports formality" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};