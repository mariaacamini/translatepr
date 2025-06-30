export interface DeepLConfig {
  apiKey: string;
  apiEndpoint: string;
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  preserveFormatting: boolean;
  formalityLevel: 'default' | 'more' | 'less' | 'prefer_more' | 'prefer_less';
}

export interface ContentTypeModel {
  id: string;
  name: string;
  description: string;
  languageCode: string;
  translationStatus: TranslationStatusEnum;
  lastTranslated: string | null;
  sourceContentId: string;
  characterCount: number;
  translationMemoryId?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export enum TranslationStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVIEW_NEEDED = 'REVIEW_NEEDED',
  CACHED = 'CACHED',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE'
}

export interface DeepLTranslationRequest {
  text: string[];
  source_lang?: string;
  target_lang: string;
  preserve_formatting?: boolean;
  formality?: string;
  split_sentences?: '0' | '1' | 'nonewlines';
  tag_handling?: 'xml' | 'html';
  ignore_tags?: string[];
  outline_detection?: boolean;
  non_splitting_tags?: string[];
  splitting_tags?: string[];
}

export interface DeepLTranslationResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

export interface DeepLUsageResponse {
  character_count: number;
  character_limit: number;
}

export interface DeepLLanguage {
  language: string;
  name: string;
  supports_formality?: boolean;
}

export interface TranslationMemoryEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  contentType: string;
  confidence: number;
  createdAt: string;
  usageCount: number;
  lastUsed: string;
}

export interface TranslationProgress {
  id: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentItem?: string;
  estimatedTimeRemaining: number;
  startedAt: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
}

export interface TranslationBatch {
  id: string;
  texts: string[];
  sourceLanguage: string;
  targetLanguage: string;
  status: TranslationStatusEnum;
  results?: string[];
  errors?: string[];
  createdAt: string;
  completedAt?: string;
  retryCount: number;
}

export interface LanguagePair {
  source: string;
  target: string;
  supported: boolean;
  formalitySupported: boolean;
}

export interface TranslationStatistics {
  totalTranslations: number;
  charactersTranslated: number;
  charactersRemaining: number;
  averageTranslationTime: number;
  successRate: number;
  cacheHitRate: number;
  languageDistribution: Record<string, number>;
  dailyUsage: Array<{
    date: string;
    characters: number;
    translations: number;
  }>;
}