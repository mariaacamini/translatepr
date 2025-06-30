import { getDeepLService } from './deeplService';
import { DeepLConfig, TranslationBatch, TranslationStatusEnum, LanguagePair, TranslationStatistics } from '../types/deepl';

export interface TranslationRequest {
  texts: string[];
  sourceLanguage: string;
  targetLanguage: string;
  contentType?: string;
  preserveFormatting?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface TranslationResponse {
  id: string;
  status: TranslationStatusEnum;
  results?: string[];
  errors?: string[];
  progress: number;
  estimatedCompletion?: string;
}

export interface TranslationStatusResponse {
  id: string;
  status: TranslationStatusEnum;
  progress: number;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  results?: string[];
  errors?: string[];
  startedAt: string;
  completedAt?: string;
}

export interface LanguageValidationResponse {
  isValid: boolean;
  sourceSupported: boolean;
  targetSupported: boolean;
  formalitySupported: boolean;
  message?: string;
}

export interface UsageStatisticsResponse {
  charactersUsed: number;
  charactersLimit: number;
  charactersRemaining: number;
  translationsToday: number;
  translationsThisMonth: number;
  cacheHitRate: number;
  averageTranslationTime: number;
  topLanguagePairs: Array<{
    pair: string;
    count: number;
  }>;
}

class TranslationApiService {
  private generateId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async requestTranslation(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const config = this.getDeepLConfig();
      const service = getDeepLService(config);

      const batchId = this.generateId();
      const batch: TranslationBatch = {
        id: batchId,
        texts: request.texts,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        status: TranslationStatusEnum.PENDING,
        createdAt: new Date().toISOString(),
        retryCount: 0
      };

      // Start translation in background
      this.processTranslationBatch(service, batch);

      return {
        id: batchId,
        status: TranslationStatusEnum.PENDING,
        progress: 0,
        estimatedCompletion: this.calculateEstimatedCompletion(request.texts.length)
      };
    } catch (error) {
      console.error('Translation request failed:', error);
      throw new Error(`Translation request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTranslationStatus(id: string): Promise<TranslationStatusResponse> {
    try {
      const config = this.getDeepLConfig();
      const service = getDeepLService(config);
      const batch = service.getBatchStatus(id);

      if (!batch) {
        throw new Error(`Translation batch ${id} not found`);
      }

      const progress = batch.results 
        ? (batch.results.length / batch.texts.length) * 100 
        : 0;

      return {
        id: batch.id,
        status: batch.status,
        progress: Math.round(progress),
        totalItems: batch.texts.length,
        completedItems: batch.results?.length || 0,
        failedItems: batch.errors?.length || 0,
        results: batch.results,
        errors: batch.errors,
        startedAt: batch.createdAt,
        completedAt: batch.completedAt
      };
    } catch (error) {
      console.error('Failed to get translation status:', error);
      throw new Error(`Failed to get translation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateLanguagePair(sourceLanguage: string, targetLanguage: string): Promise<LanguageValidationResponse> {
    try {
      const config = this.getDeepLConfig();
      const service = getDeepLService(config);
      const validation = await service.validateLanguagePair(sourceLanguage, targetLanguage);

      return {
        isValid: validation.supported,
        sourceSupported: validation.supported,
        targetSupported: validation.supported,
        formalitySupported: validation.formalitySupported,
        message: validation.supported 
          ? 'Language pair is supported' 
          : `Language pair ${sourceLanguage} → ${targetLanguage} is not supported`
      };
    } catch (error) {
      console.error('Language pair validation failed:', error);
      return {
        isValid: false,
        sourceSupported: false,
        targetSupported: false,
        formalitySupported: false,
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getUsageStatistics(): Promise<UsageStatisticsResponse> {
    try {
      const config = this.getDeepLConfig();
      const service = getDeepLService(config);
      const [deeplUsage, translationStats] = await Promise.all([
        service.getUsageStatistics(),
        service.getTranslationStatistics()
      ]);

      const topLanguagePairs = Object.entries(translationStats.languageDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([pair, count]) => ({ pair, count }));

      return {
        charactersUsed: deeplUsage.character_count,
        charactersLimit: deeplUsage.character_limit,
        charactersRemaining: deeplUsage.character_limit - deeplUsage.character_count,
        translationsToday: this.getTodayTranslations(translationStats),
        translationsThisMonth: this.getMonthTranslations(translationStats),
        cacheHitRate: translationStats.cacheHitRate,
        averageTranslationTime: translationStats.averageTranslationTime,
        topLanguagePairs
      };
    } catch (error) {
      console.error('Failed to get usage statistics:', error);
      throw new Error(`Failed to get usage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const config = this.getDeepLConfig();
      const service = getDeepLService(config);
      return await service.detectLanguage(text);
    } catch (error) {
      console.error('Language detection failed:', error);
      throw new Error(`Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSupportedLanguages(): Promise<{ source: string[]; target: string[] }> {
    try {
      const config = this.getDeepLConfig();
      const service = getDeepLService(config);
      const languages = await service.getSupportedLanguages();

      return {
        source: languages.source.map(lang => lang.language),
        target: languages.target.map(lang => lang.language)
      };
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      throw new Error(`Failed to get supported languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelTranslation(id: string): Promise<void> {
    try {
      const config = this.getDeepLConfig();
      const service = getDeepLService(config);
      const batch = service.getBatchStatus(id);

      if (batch && batch.status === TranslationStatusEnum.IN_PROGRESS) {
        // Mark as cancelled (in a real implementation, you'd stop the actual process)
        batch.status = TranslationStatusEnum.FAILED;
        batch.errors = ['Translation cancelled by user'];
      }
    } catch (error) {
      console.error('Failed to cancel translation:', error);
      throw new Error(`Failed to cancel translation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processTranslationBatch(service: any, batch: TranslationBatch): Promise<void> {
    try {
      await service.translateBatch(batch);
    } catch (error) {
      console.error('Batch translation failed:', error);
    }
  }

  private getDeepLConfig(): DeepLConfig {
    const savedConfig = localStorage.getItem('deepl_config');
    if (!savedConfig) {
      throw new Error('DeepL configuration not found. Please configure DeepL settings first.');
    }

    const config = JSON.parse(savedConfig) as DeepLConfig;
    if (!config.apiKey) {
      throw new Error('DeepL API key not configured. Please add your API key in settings.');
    }

    return config;
  }

  private calculateEstimatedCompletion(textCount: number): string {
    // Rough estimation: 100 characters per second
    const estimatedSeconds = textCount * 2; // 2 seconds per text on average
    const completionTime = new Date(Date.now() + estimatedSeconds * 1000);
    return completionTime.toISOString();
  }

  private getTodayTranslations(stats: TranslationStatistics): number {
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = stats.dailyUsage.find(usage => usage.date === today);
    return todayUsage?.translations || 0;
  }

  private getMonthTranslations(stats: TranslationStatistics): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return stats.dailyUsage
      .filter(usage => {
        const usageDate = new Date(usage.date);
        return usageDate.getMonth() === currentMonth && usageDate.getFullYear() === currentYear;
      })
      .reduce((sum, usage) => sum + usage.translations, 0);
  }
}

export const translationApiService = new TranslationApiService();