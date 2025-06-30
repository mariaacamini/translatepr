import React, { useEffect } from 'react';
import { 
  LanguageIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { StatsCard } from './StatsCard';
import { RecentActivity } from './RecentActivity';
import { TranslationChart } from './TranslationChart';
import { LanguageBreakdown } from './LanguageBreakdown';
import { useTranslationStore } from '../../store/translationStore';
import { translationService } from '../../services/translationService';

export const Dashboard: React.FC = () => {
  const { stats, setStats, isLoading, setLoading, setError } = useTranslationStore();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const statsData = await translationService.getStats();
        setStats(statsData);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [setStats, setLoading, setError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Translations',
      value: stats?.totalTranslations || 0,
      icon: LanguageIcon,
      change: { value: 12, type: 'increase' as const },
      description: 'Across all languages'
    },
    {
      title: 'Completed',
      value: stats?.completedTranslations || 0,
      icon: CheckCircleIcon,
      change: { value: 8, type: 'increase' as const },
      description: 'Ready for publishing'
    },
    {
      title: 'In Progress',
      value: stats?.pendingTranslations || 0,
      icon: ClockIcon,
      description: 'Being translated'
    },
    {
      title: 'Failed',
      value: stats?.failedTranslations || 0,
      icon: ExclamationTriangleIcon,
      change: { value: 2, type: 'decrease' as const },
      description: 'Need attention'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Translation Progress</h3>
          <TranslationChart />
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Language Breakdown</h3>
          <LanguageBreakdown data={stats?.translationsByLanguage || {}} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <RecentActivity />
      </div>
    </div>
  );
};