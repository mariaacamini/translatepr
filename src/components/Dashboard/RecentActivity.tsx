import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';
import { TranslationStatus } from '../../types';
import { getLanguageFlag } from '../../constants/languages';

interface ActivityItem {
  id: string;
  type: 'translation_completed' | 'translation_started' | 'translation_failed' | 'job_created';
  title: string;
  description: string;
  timestamp: string;
  status: TranslationStatus;
  languages?: {
    source: string;
    target: string;
  };
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'translation_completed',
    title: 'Product "Wireless Headphones" translated',
    description: 'Successfully translated to Spanish',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: TranslationStatus.COMPLETED,
    languages: { source: 'en', target: 'es' }
  },
  {
    id: '2',
    type: 'job_created',
    title: 'Bulk translation job started',
    description: '25 products queued for translation to French',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: TranslationStatus.IN_PROGRESS,
    languages: { source: 'en', target: 'fr' }
  },
  {
    id: '3',
    type: 'translation_failed',
    title: 'Category "Electronics" translation failed',
    description: 'Translation to German failed due to API limit',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: TranslationStatus.FAILED,
    languages: { source: 'en', target: 'de' }
  },
  {
    id: '4',
    type: 'translation_completed',
    title: 'Page "About Us" translated',
    description: 'Successfully translated to Italian',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: TranslationStatus.COMPLETED,
    languages: { source: 'en', target: 'it' }
  },
  {
    id: '5',
    type: 'translation_started',
    title: 'Collection "Summer Sale" translation started',
    description: 'Auto-translation to Portuguese in progress',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: TranslationStatus.IN_PROGRESS,
    languages: { source: 'en', target: 'pt' }
  }
];

const getActivityIcon = (type: ActivityItem['type'], status: TranslationStatus) => {
  switch (status) {
    case TranslationStatus.COMPLETED:
      return CheckCircleIcon;
    case TranslationStatus.FAILED:
      return ExclamationCircleIcon;
    case TranslationStatus.IN_PROGRESS:
      return ClockIcon;
    default:
      return LanguageIcon;
  }
};

const getActivityColor = (status: TranslationStatus) => {
  switch (status) {
    case TranslationStatus.COMPLETED:
      return 'text-green-600 bg-green-100';
    case TranslationStatus.FAILED:
      return 'text-red-600 bg-red-100';
    case TranslationStatus.IN_PROGRESS:
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-blue-600 bg-blue-100';
  }
};

export const RecentActivity: React.FC = () => {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {mockActivity.map((activity, activityIdx) => {
          const Icon = getActivityIcon(activity.type, activity.status);
          const colorClass = getActivityColor(activity.status);
          
          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== mockActivity.length - 1 ? (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div className={`relative px-1`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${colorClass}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        {activity.languages && (
                          <div className="flex items-center space-x-1 text-xs">
                            <span>{getLanguageFlag(activity.languages.source)}</span>
                            <span className="text-gray-400">→</span>
                            <span>{getLanguageFlag(activity.languages.target)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.description}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};