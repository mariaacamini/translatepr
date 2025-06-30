import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  DeepLConfig, 
  DeepLTranslationRequest, 
  DeepLTranslationResponse, 
  DeepLUsageResponse,
  DeepLLanguage,
  TranslationMemoryEntry,
  TranslationBatch,
  TranslationStatusEnum,
  LanguagePair,
  TranslationStatistics
} from '../types/deepl';

export class DeepLService {
  private client: AxiosInstance;
  private config: DeepLConfig;
  private translationMemory: Map<string, TranslationMemoryEntry> = new Map();
  private activeBatches: Map<string, TranslationBatch> = new Map();

  constructor(config: DeepLConfig) {
    this.config = config;
    this.setupClient();
    this.loadTranslationMemory();
  }

  private setupClient(): void {
    this.client = axios.create({
      baseURL: this.config.apiEndpoint,
      timeout: 30000,
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Saleor-Translation-Manager/1.0'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`DeepL API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('DeepL API Error:', error.response?.data || error.message);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          return new Error(`Bad Request: ${data.message || 'Invalid parameters'}`);
        case 401:
          return new Error('Authentication failed: Invalid API key');
        case 403:
          return new Error('Authorization failed: API key lacks permissions');
        case 413:
          return new Error('Request too large: Text exceeds maximum length');
        case 429:
          return new Error('Rate limit exceeded: Too many requests');
        case 456:
          return new Error('Quota exceeded: Character limit reached');
        case 503:
          return new Error('Service unavailable: DeepL API is temporarily down');
        default:
          return new Error(`API Error ${status}: ${data.message || 'Unknown error'}`);
      }
    }

    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout: DeepL API did not respond in time');
    }

    return new Error(`Network error: ${error.message}`);
  }

  async translateText(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string,
    options: Partial<DeepLTranslationRequest> = {}
  ): Promise<string[]> {
    // Check translation memory first
    const cachedResults = await this.checkTranslationMemory(texts, sourceLanguage || 'auto', targetLanguage);
    const uncachedTexts = texts.filter((_, index) => !cachedResults[index]);
    
    if (uncachedTexts.length === 0) {
      return cachedResults.map(result => result!);
    }

    const request: DeepLTranslationRequest = {
      text: uncachedTexts,
      target_lang: targetLanguage.toUpperCase(),
      preserve_formatting: this.config.preserveFormatting,
      formality: this.config.formalityLevel,
      tag_handling: 'html',
      split_sentences: '1',
      ...options
    };

    if (sourceLanguage && sourceLanguage !== 'auto') {
      request.source_lang = sourceLanguage.toUpperCase();
    }

    try {
      const response = await this.executeWithRetry(() => 
        this.client.post<DeepLTranslationResponse>('/v2/translate', request)
      );

      const translations = response.data.translations.map(t => t.text);
      
      // Store in translation memory
      await this.storeInTranslationMemory(
        uncachedTexts,
        translations,
        sourceLanguage || response.data.translations[0]?.detected_source_language || 'auto',
        targetLanguage
      );

      // Merge cached and new translations
      const results: string[] = [];
      let uncachedIndex = 0;
      
      for (let i = 0; i < texts.length; i++) {
        if (cachedResults[i]) {
          results[i] = cachedResults[i]!;
        } else {
          results[i] = translations[uncachedIndex++];
        }
      }

      return results;
    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }

  async translateBatch(batch: TranslationBatch): Promise<TranslationBatch> {
    this.activeBatches.set(batch.id, { ...batch, status: TranslationStatusEnum.IN_PROGRESS });

    try {
      const results = await this.translateText(
        batch.texts,
        batch.targetLanguage,
        batch.sourceLanguage
      );

      const completedBatch: TranslationBatch = {
        ...batch,
        status: TranslationStatusEnum.COMPLETED,
        results,
        completedAt: new Date().toISOString()
      };

      this.activeBatches.set(batch.id, completedBatch);
      return completedBatch;
    } catch (error) {
      const failedBatch: TranslationBatch = {
        ...batch,
        status: TranslationStatusEnum.FAILED,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        retryCount: batch.retryCount + 1
      };

      this.activeBatches.set(batch.id, failedBatch);
      
      // Retry if under limit
      if (failedBatch.retryCount < this.config.maxRetries) {
        await this.delay(this.config.retryDelay * Math.pow(2, failedBatch.retryCount));
        return this.translateBatch(failedBatch);
      }

      throw error;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await this.client.post<DeepLTranslationResponse>('/v2/translate', {
        text: [text.substring(0, 1000)], // Use first 1000 chars for detection
        target_lang: 'EN' // Dummy target for detection
      });

      return response.data.translations[0]?.detected_source_language || 'unknown';
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'unknown';
    }
  }

  async getSupportedLanguages(): Promise<{ source: DeepLLanguage[]; target: DeepLLanguage[] }> {
    try {
      const [sourceResponse, targetResponse] = await Promise.all([
        this.client.get<DeepLLanguage[]>('/v2/languages?type=source'),
        this.client.get<DeepLLanguage[]>('/v2/languages?type=target')
      ]);

      return {
        source: sourceResponse.data,
        target: targetResponse.data
      };
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      throw error;
    }
  }

  async validateLanguagePair(sourceLanguage: string, targetLanguage: string): Promise<LanguagePair> {
    try {
      const languages = await this.getSupportedLanguages();
      
      const sourceSupported = languages.source.some(lang => 
        lang.language.toLowerCase() === sourceLanguage.toLowerCase()
      );
      
      const targetLang = languages.target.find(lang => 
        lang.language.toLowerCase() === targetLanguage.toLowerCase()
      );
      
      const targetSupported = !!targetLang;
      const formalitySupported = targetLang?.supports_formality || false;

      return {
        source: sourceLanguage,
        target: targetLanguage,
        supported: sourceSupported && targetSupported,
        formalitySupported
      };
    } catch (error) {
      console.error('Language pair validation failed:', error);
      return {
        source: sourceLanguage,
        target: targetLanguage,
        supported: false,
        formalitySupported: false
      };
    }
  }

  async getUsageStatistics(): Promise<DeepLUsageResponse> {
    try {
      const response = await this.client.get<DeepLUsageResponse>('/v2/usage');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch usage statistics:', error);
      throw error;
    }
  }

  async getTranslationStatistics(): Promise<TranslationStatistics> {
    const usage = await this.getUsageStatistics();
    const memoryEntries = Array.from(this.translationMemory.values());
    
    const totalTranslations = memoryEntries.length;
    const charactersTranslated = memoryEntries.reduce((sum, entry) => sum + entry.sourceText.length, 0);
    const averageTranslationTime = this.calculateAverageTranslationTime();
    const successRate = this.calculateSuccessRate();
    const cacheHitRate = this.calculateCacheHitRate();
    
    const languageDistribution = memoryEntries.reduce((dist, entry) => {
      const key = `${entry.sourceLanguage}-${entry.targetLanguage}`;
      dist[key] = (dist[key] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      totalTranslations,
      charactersTranslated,
      charactersRemaining: usage.character_limit - usage.character_count,
      averageTranslationTime,
      successRate,
      cacheHitRate,
      languageDistribution,
      dailyUsage: this.getDailyUsage()
    };
  }

  private async checkTranslationMemory(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<(string | null)[]> {
    return texts.map(text => {
      const key = this.getMemoryKey(text, sourceLanguage, targetLanguage);
      const entry = this.translationMemory.get(key);
      
      if (entry) {
        // Update usage statistics
        entry.usageCount++;
        entry.lastUsed = new Date().toISOString();
        return entry.translatedText;
      }
      
      return null;
    });
  }

  private async storeInTranslationMemory(
    sourceTexts: string[],
    translatedTexts: string[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<void> {
    for (let i = 0; i < sourceTexts.length; i++) {
      const key = this.getMemoryKey(sourceTexts[i], sourceLanguage, targetLanguage);
      const entry: TranslationMemoryEntry = {
        id: key,
        sourceText: sourceTexts[i],
        translatedText: translatedTexts[i],
        sourceLanguage,
        targetLanguage,
        contentType: 'text',
        confidence: 1.0,
        createdAt: new Date().toISOString(),
        usageCount: 1,
        lastUsed: new Date().toISOString()
      };
      
      this.translationMemory.set(key, entry);
    }
    
    // Persist to localStorage
    this.saveTranslationMemory();
  }

  private getMemoryKey(text: string, sourceLanguage: string, targetLanguage: string): string {
    const textHash = this.simpleHash(text.trim().toLowerCase());
    return `${sourceLanguage}-${targetLanguage}-${textHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private loadTranslationMemory(): void {
    try {
      const stored = localStorage.getItem('deepl_translation_memory');
      if (stored) {
        const entries = JSON.parse(stored) as TranslationMemoryEntry[];
        entries.forEach(entry => {
          this.translationMemory.set(entry.id, entry);
        });
      }
    } catch (error) {
      console.error('Failed to load translation memory:', error);
    }
  }

  private saveTranslationMemory(): void {
    try {
      const entries = Array.from(this.translationMemory.values());
      localStorage.setItem('deepl_translation_memory', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save translation memory:', error);
    }
  }

  private calculateAverageTranslationTime(): number {
    // Mock calculation - in real implementation, track actual times
    return 2.5;
  }

  private calculateSuccessRate(): number {
    const batches = Array.from(this.activeBatches.values());
    if (batches.length === 0) return 100;
    
    const successful = batches.filter(b => b.status === TranslationStatusEnum.COMPLETED).length;
    return (successful / batches.length) * 100;
  }

  private calculateCacheHitRate(): number {
    // Mock calculation - in real implementation, track cache hits vs misses
    return 35.2;
  }

  private getDailyUsage(): Array<{ date: string; characters: number; translations: number }> {
    // Mock data - in real implementation, track daily usage
    const days = 7;
    const usage = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      usage.push({
        date: date.toISOString().split('T')[0],
        characters: Math.floor(Math.random() * 10000) + 5000,
        translations: Math.floor(Math.random() * 100) + 50
      });
    }
    
    return usage;
  }

  // Public methods for managing translation memory
  async clearTranslationMemory(): Promise<void> {
    this.translationMemory.clear();
    localStorage.removeItem('deepl_translation_memory');
  }

  async exportTranslationMemory(): Promise<TranslationMemoryEntry[]> {
    return Array.from(this.translationMemory.values());
  }

  async importTranslationMemory(entries: TranslationMemoryEntry[]): Promise<void> {
    entries.forEach(entry => {
      this.translationMemory.set(entry.id, entry);
    });
    this.saveTranslationMemory();
  }

  getBatchStatus(batchId: string): TranslationBatch | null {
    return this.activeBatches.get(batchId) || null;
  }

  getAllBatches(): TranslationBatch[] {
    return Array.from(this.activeBatches.values());
  }
}

// Singleton instance
let deeplServiceInstance: DeepLService | null = null;

export const getDeepLService = (config?: DeepLConfig): DeepLService => {
  if (!deeplServiceInstance && config) {
    deeplServiceInstance = new DeepLService(config);
  }
  
  if (!deeplServiceInstance) {
    throw new Error('DeepL service not initialized. Please provide configuration.');
  }
  
  return deeplServiceInstance;
};

export const initializeDeepLService = (config: DeepLConfig): DeepLService => {
  deeplServiceInstance = new DeepLService(config);
  return deeplServiceInstance;
};