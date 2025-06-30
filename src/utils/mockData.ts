import { Translation, TranslationJob, TranslationProject, TranslationStats, TranslationStatus, TranslationProvider } from '../types';

export const mockTranslations: Translation[] = [
  {
    id: '1',
    sourceText: 'Premium Wireless Headphones with Active Noise Cancellation',
    translatedText: 'Auriculares Inalámbricos Premium con Cancelación Activa de Ruido',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    context: 'product:UHJvZHVjdDox',
    status: TranslationStatus.COMPLETED,
    provider: TranslationProvider.DEEPL,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:30:00Z',
    metadata: {
      contentType: 'product',
      entityId: 'UHJvZHVjdDox',
      field: 'name'
    }
  },
  {
    id: '2',
    sourceText: 'Experience crystal-clear audio with our state-of-the-art noise cancellation technology.',
    translatedText: 'Découvrez un son cristallin avec notre technologie de suppression de bruit de pointe.',
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    context: 'product:UHJvZHVjdDox',
    status: TranslationStatus.COMPLETED,
    provider: TranslationProvider.GOOGLE,
    createdAt: '2025-01-01T11:00:00Z',
    updatedAt: '2025-01-01T11:25:00Z',
    metadata: {
      contentType: 'product',
      entityId: 'UHJvZHVjdDox',
      field: 'description'
    }
  },
  {
    id: '3',
    sourceText: 'Electronics & Accessories',
    translatedText: '',
    sourceLanguage: 'en',
    targetLanguage: 'de',
    context: 'category:Q2F0ZWdvcnk6MQ==',
    status: TranslationStatus.PENDING,
    provider: TranslationProvider.DEEPL,
    createdAt: '2025-01-01T12:00:00Z',
    updatedAt: '2025-01-01T12:00:00Z',
    metadata: {
      contentType: 'category',
      entityId: 'Q2F0ZWdvcnk6MQ==',
      field: 'name'
    }
  }
];

export const mockJobs: TranslationJob[] = [
  {
    id: 'job_1',
    status: TranslationStatus.IN_PROGRESS,
    progress: 75,
    totalItems: 20,
    completedItems: 15,
    failedItems: 0,
    targetLanguages: ['es', 'fr'],
    contentType: 'products',
    createdAt: '2025-01-01T09:00:00Z',
    estimatedCompletion: '2025-01-01T14:30:00Z'
  },
  {
    id: 'job_2',
    status: TranslationStatus.COMPLETED,
    progress: 100,
    totalItems: 5,
    completedItems: 5,
    failedItems: 0,
    targetLanguages: ['de'],
    contentType: 'categories',
    createdAt: '2025-01-01T08:00:00Z'
  },
  {
    id: 'job_3',
    status: TranslationStatus.FAILED,
    progress: 30,
    totalItems: 10,
    completedItems: 3,
    failedItems: 7,
    targetLanguages: ['it', 'pt'],
    contentType: 'pages',
    createdAt: '2025-01-01T07:00:00Z'
  }
];

export const mockProjects: TranslationProject[] = [
  {
    id: 'project_1',
    name: 'Winter Collection 2025',
    sourceLanguage: 'en',
    targetLanguages: ['es', 'fr', 'de', 'it'],
    status: 'active',
    progress: 85,
    totalTranslations: 150,
    completedTranslations: 128,
    createdAt: '2024-12-15T00:00:00Z'
  },
  {
    id: 'project_2',
    name: 'Website Localization',
    sourceLanguage: 'en',
    targetLanguages: ['ja', 'ko', 'zh'],
    status: 'active',
    progress: 45,
    totalTranslations: 80,
    completedTranslations: 36,
    createdAt: '2024-12-20T00:00:00Z'
  }
];

export const mockStats: TranslationStats = {
  totalTranslations: 1247,
  completedTranslations: 1156,
  pendingTranslations: 68,
  failedTranslations: 23,
  translationsByLanguage: {
    'es': 425,
    'fr': 380,
    'de': 298,
    'it': 144,
    'pt': 89,
    'ja': 67,
    'ko': 44
  },
  translationsByProvider: {
    'DEEPL': 756,
    'GOOGLE': 401,
    'MANUAL': 90
  },
  averageTranslationTime: 4.2,
  charactersTranslated: 156789
};