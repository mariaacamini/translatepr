import React, { useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslationStore } from '../../store/translationStore';
import { translationService } from '../../services/translationService';
import { TranslationStatus } from '../../types';
import { getLanguageFlag, getLanguageName } from '../../constants/languages';

export const QueueManager: React.FC = () => {
  const { jobs, setJobs, isLoading, setLoading, setError } = useTranslationStore();

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const jobsData = await translationService.getJobs();
        setJobs(jobsData);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
    
    // Refresh jobs every 5 seconds
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, [setJobs, setLoading, setError]);

  const handleCancelJob = async (jobId: string) => {
    try {
      await translationService.cancelJob(jobId);
      // Refresh jobs list
      const jobsData = await translationService.getJobs();
      setJobs(jobsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cancel job');
    }
  };

  const getStatusIcon = (status: TranslationStatus) => {
    switch (status) {
      case TranslationStatus.COMPLETED:
        return CheckCircleIcon;
      case TranslationStatus.FAILED:
        return ExclamationCircleIcon;
      case TranslationStatus.IN_PROGRESS:
        return PlayIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusColor = (status: TranslationStatus) => {
    switch (status) {
      case TranslationStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      case TranslationStatus.FAILED:
        return 'text-red-600 bg-red-100';
      case TranslationStatus.IN_PROGRESS:
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Queue Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{jobs.filter(j => j.status === TranslationStatus.PENDING).length}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{jobs.filter(j => j.status === TranslationStatus.IN_PROGRESS).length}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{jobs.filter(j => j.status === TranslationStatus.COMPLETED).length}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{jobs.filter(j => j.status === TranslationStatus.FAILED).length}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Translation Jobs</h3>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs in queue</h3>
            <p className="mt-1 text-sm text-gray-500">Start a translation job to see it here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {jobs.map((job) => {
              const StatusIcon = getStatusIcon(job.status);
              const statusColor = getStatusColor(job.status);
              const progressPercentage = job.totalItems > 0 ? (job.completedItems / job.totalItems) * 100 : 0;
              
              return (
                <li key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${statusColor}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {job.contentType} Translation Job
                          </h4>
                          <div className="flex items-center space-x-1">
                            {job.targetLanguages.map((lang) => (
                              <span key={lang} className="text-lg" title={getLanguageName(lang)}>
                                {getLanguageFlag(lang)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{job.completedItems} / {job.totalItems} items</span>
                          {job.failedItems > 0 && (
                            <span className="text-red-600">{job.failedItems} failed</span>
                          )}
                          <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        {job.status === TranslationStatus.IN_PROGRESS && (
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {Math.round(progressPercentage)}% complete
                              {job.estimatedCompletion && (
                                <span className="ml-2">
                                  Est. completion: {new Date(job.estimatedCompletion).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {job.status === TranslationStatus.IN_PROGRESS && (
                        <button
                          onClick={() => handleCancelJob(job.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Cancel Job"
                        >
                          <StopIcon className="h-5 w-5" />
                        </button>
                      )}
                      {(job.status === TranslationStatus.COMPLETED || job.status === TranslationStatus.FAILED) && (
                        <button
                          onClick={() => handleCancelJob(job.id)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                          title="Remove Job"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};