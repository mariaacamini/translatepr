export interface SaleorContentType {
  id: string;
  name: string;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  fields: SaleorTranslatableField[];
  estimatedCharacters: number;
  lastSync?: string;
}

export interface SaleorTranslatableField {
  name: string;
  type: 'text' | 'richText' | 'json' | 'slug';
  required: boolean;
  maxLength?: number;
  validation?: ValidationRule[];
  preserveFormatting: boolean;
}

export interface ValidationRule {
  type: 'minLength' | 'maxLength' | 'pattern' | 'required' | 'noHtml' | 'preserveLinks';
  value?: string | number;
  message: string;
}

export interface TranslationQueueItem {
  id: string;
  contentType: string;
  entityId: string;
  entityName: string;
  sourceLanguage: string;
  targetLanguage: string;
  fields: QueueItemField[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'review';
  priority: 'high' | 'medium' | 'low';
  characterCount: number;
  estimatedTime: number; // in minutes
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface QueueItemField {
  name: string;
  sourceText: string;
  translatedText?: string;
  characterCount: number;
  status: 'pending' | 'completed' | 'failed';
  lastModified?: string;
  modifiedBy?: string;
}

export interface TranslationHistory {
  id: string;
  queueItemId: string;
  action: 'created' | 'started' | 'completed' | 'failed' | 'modified' | 'approved' | 'rejected';
  timestamp: string;
  userId?: string;
  userName?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

export interface SaleorConfig {
  apiEndpoint: string;
  authToken: string;
  webhookSecret?: string;
  defaultSourceLanguage: string;
  enabledTargetLanguages: string[];
  batchSize: number;
  rateLimitPerMinute: number;
  autoTranslationEnabled: boolean;
  autoTranslationRules: AutoTranslationRule[];
  syncSettings: SyncSettings;
}

export interface AutoTranslationRule {
  contentType: string;
  fields: string[];
  condition?: string;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // in minutes
  conflictResolution: 'overwrite' | 'skip' | 'manual';
  backupBeforeSync: boolean;
}

export interface TranslationMetrics {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  averageCompletionTime: number;
  successRate: number;
  charactersThroughput: number;
  translatorPerformance: Record<string, {
    completed: number;
    averageTime: number;
    accuracy: number;
  }>;
}

export interface WebhookEvent {
  id: string;
  type: 'product.created' | 'product.updated' | 'category.created' | 'category.updated' | 'collection.created' | 'collection.updated';
  timestamp: string;
  entityId: string;
  changes: Record<string, any>;
  processed: boolean;
}