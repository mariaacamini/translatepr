import React, { useState, useEffect } from 'react';
import { 
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { translationApiService, TranslationRequest, TranslationStatusResponse } from '../../services/translationApiService';
import { getLanguageFlag, getLanguageName } from '../../constants/languages';

interface TranslationJob {
  id: string;
  request: TranslationRequest;
  status: TranslationStatusResponse | null;
  startedAt: string;
}

export const DeepLTranslationManager: React.FC = () => {
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTranslation, setNewTranslation] = useState({
    texts: [''],
    sourceLanguage: 'en',
    targetLanguage: 'es',
    contentType: 'text',
    preserveFormatting: true
  });
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(false);

  useEffect(() => {
    const interval = setInterval(updateJobStatuses, 2000);
    return () => clearInterval(interval);
  }, [jobs]);

  const updateJobStatuses = async () => {
    const activeJobs = jobs.filter(job => 
      job.status?.status === 'IN_PROGRESS' || job.status?.status === 'PENDING'
    );

    for (const job of activeJobs) {
      try {
        const status = await translationApiService.getTranslationStatus(job.id);
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status } : j
        ));
      } catch (error) {
        console.error(`Failed to update status for job ${job.id}:`, error);
      }
    }
  };

  const addTextInput = () => {
    setNewTranslation(prev => ({
      ...prev,
      texts: [...prev.texts, '']
    }));
  };

  const updateTextInput = (index: number, value: string) => {
    setNewTranslation(prev => ({
      ...prev,
      texts: prev.texts.map((text, i) => i === index ? value : text)
    }));
  };

  const removeTextInput = (index: number) => {
    setNewTranslation(prev => ({
      ...prev,
      texts: prev.texts.filter((_, i) => i !== index)
    }));
  };

  const detectLanguage = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      const detectedLanguage = await translationApiService.detectLanguage(text);
      if (detectedLanguage !== 'unknown') {
        setNewTranslation(prev => ({
          ...prev,
          sourceLanguage: detectedLanguage.toLowerCase()
        }));
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    }
  };

  const startTranslation = async () => {
    const validTexts = newTranslation.texts.filter(text => text.trim());
    if (validTexts.length === 0) return;

    setIsLoading(true);
    try {
      // Auto-detect language if enabled
      if (autoDetectLanguage && validTexts[0]) {
        await detectLanguage(validTexts[0]);
      }

      const request: TranslationRequest = {
        ...newTranslation,
        texts: validTexts
      };

      const response = await translationApiService.requestTranslation(request);
      
      const newJob: TranslationJob = {
        id: response.id,
        request,
        status: null,
        startedAt: new Date().toISOString()
      };

      setJobs(prev => [newJob, ...prev]);
      
      // Reset form
      setNewTranslation(prev => ({
        ...prev,
        texts: ['']
      }));
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelTranslation = async (jobId: string) => {
    try {
      await translationApiService.cancelTranslation(jobId);
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: { ...job.status!, status: 'FAILED' as any } }
          : job
      ));
    } catch (error) {
      console.error('Failed to cancel translation:', error);
    }
  };

  const retryTranslation = async (job: TranslationJob) => {
    try {
      const response = await translationApiService.requestTranslation(job.request);
      setJobs(prev => prev.map(j => 
        j.id === job.id 
          ? { ...j, id: response.id, status: null, startedAt: new Date().toISOString() }
          : j
      ));
    } catch (error) {
      console.error('Failed to retry translation:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircleIcon;
      case 'FAILED': return ExclamationCircleIcon;
      case 'IN_PROGRESS': return PlayIcon;
      default: return ClockIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Translation Form */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">New Translation</h3>
          <p className="text-sm text-gray-500 mt-1">
            Translate text using DeepL API with advanced options
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Language
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={newTranslation.sourceLanguage}
                  onChange={(e) => setNewTranslation(prev => ({ ...prev, sourceLanguage: e.target.value }))}
                  disabled={autoDetectLanguage}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="it">🇮🇹 Italian</option>
                  <option value="pt">🇵🇹 Portuguese</option>
                </select>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={autoDetectLanguage}
                    onChange={(e) => setAutoDetectLanguage(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-600">Auto</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Language
              </label>
              <select
                value={newTranslation.targetLanguage}
                onChange={(e) => setNewTranslation(prev => ({ ...prev, targetLanguage: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
                <option value="de">🇩🇪 German</option>
                <option value="it">🇮🇹 Italian</option>
                <option value="pt">🇵🇹 Portuguese</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={newTranslation.contentType}
                onChange={(e) => setNewTranslation(prev => ({ ...prev, contentType: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="text">Plain Text</option>
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
                <option value="product">Product Description</option>
                <option value="category">Category Description</option>
              </select>
            </div>
          </div>

          {/* Text Inputs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Text to Translate
              </label>
              <button
                onClick={addTextInput}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                + Add Text
              </button>
            </div>
            <div className="space-y-3">
              {newTranslation.texts.map((text, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <textarea
                    value={text}
                    onChange={(e) => updateTextInput(index, e.target.value)}
                    placeholder={`Enter text ${index + 1}...`}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  {newTranslation.texts.length > 1 && (
                    <button
                      onClick={() => removeTextInput(index)}
                      className="mt-2 text-red-600 hover:text-red-800 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newTranslation.preserveFormatting}
                onChange={(e) => setNewTranslation(prev => ({ ...prev, preserveFormatting: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Preserve Formatting</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={startTranslation}
              disabled={isLoading || newTranslation.texts.every(text => !text.trim())}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Starting...' : 'Start Translation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Translation Jobs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Translation Jobs</h3>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage your translation requests
          </p>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No translation jobs</h3>
            <p className="mt-1 text-sm text-gray-500">Start a translation to see it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => {
              const StatusIcon = getStatusIcon(job.status?.status || 'PENDING');
              const statusColor = getStatusColor(job.status?.status || 'PENDING');
              
              return (
                <div key={job.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${statusColor}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {job.request.texts.length} text{job.request.texts.length > 1 ? 's' : ''} • 
                            {getLanguageFlag(job.request.sourceLanguage)} → {getLanguageFlag(job.request.targetLanguage)}
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {job.request.contentType}
                          </span>
                        </div>
                        
                        {job.status && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>Progress: {job.status.completedItems} / {job.status.totalItems}</span>
                              <span>{job.status.progress}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.status.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Started: {new Date(job.startedAt).toLocaleString()}
                          {job.status?.completedAt && (
                            <span className="ml-4">
                              Completed: {new Date(job.status.completedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        {/* Preview of texts */}
                        <div className="mt-3 space-y-2">
                          {job.request.texts.slice(0, 2).map((text, index) => (
                            <div key={index} className="bg-gray-50 rounded p-2">
                              <div className="text-xs text-gray-500 mb-1">Source:</div>
                              <div className="text-sm text-gray-800 truncate">{text}</div>
                              {job.status?.results?.[index] && (
                                <>
                                  <div className="text-xs text-gray-500 mt-2 mb-1">Translation:</div>
                                  <div className="text-sm text-blue-800">{job.status.results[index]}</div>
                                </>
                              )}
                            </div>
                          ))}
                          {job.request.texts.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{job.request.texts.length - 2} more texts...
                            </div>
                          )}
                        </div>
                        
                        {job.status?.errors && job.status.errors.length > 0 && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <div className="text-xs text-red-600 font-medium mb-1">Errors:</div>
                            {job.status.errors.map((error, index) => (
                              <div key={index} className="text-xs text-red-600">{error}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {job.status?.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => cancelTranslation(job.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Cancel Translation"
                        >
                          <StopIcon className="h-4 w-4" />
                        </button>
                      )}
                      {job.status?.status === 'FAILED' && (
                        <button
                          onClick={() => retryTranslation(job)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Retry Translation"
                        >
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