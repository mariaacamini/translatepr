import axios from 'axios';
import { Translation, TranslationJob, TranslationProject, TranslationStats, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class TranslationService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('saleor_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Translation CRUD operations
  async getTranslations(projectId?: string): Promise<Translation[]> {
    const response = await this.apiClient.get<ApiResponse<Translation[]>>('/translations', {
      params: { projectId }
    });
    return response.data.data || [];
  }

  async getTranslation(id: string): Promise<Translation | null> {
    const response = await this.apiClient.get<ApiResponse<Translation>>(`/translations/${id}`);
    return response.data.data || null;
  }

  async createTranslation(translation: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Translation> {
    const response = await this.apiClient.post<ApiResponse<Translation>>('/translations', translation);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create translation');
    }
    return response.data.data!;
  }

  async updateTranslation(id: string, updates: Partial<Translation>): Promise<Translation> {
    const response = await this.apiClient.put<ApiResponse<Translation>>(`/translations/${id}`, updates);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update translation');
    }
    return response.data.data!;
  }

  async deleteTranslation(id: string): Promise<void> {
    const response = await this.apiClient.delete<ApiResponse<void>>(`/translations/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete translation');
    }
  }

  // Job management
  async getJobs(): Promise<TranslationJob[]> {
    const response = await this.apiClient.get<ApiResponse<TranslationJob[]>>('/jobs');
    return response.data.data || [];
  }

  async createJob(job: Omit<TranslationJob, 'id' | 'createdAt'>): Promise<TranslationJob> {
    const response = await this.apiClient.post<ApiResponse<TranslationJob>>('/jobs', job);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create job');
    }
    return response.data.data!;
  }

  async cancelJob(id: string): Promise<void> {
    const response = await this.apiClient.post<ApiResponse<void>>(`/jobs/${id}/cancel`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to cancel job');
    }
  }

  // Project management
  async getProjects(): Promise<TranslationProject[]> {
    const response = await this.apiClient.get<ApiResponse<TranslationProject[]>>('/projects');
    return response.data.data || [];
  }

  async createProject(project: Omit<TranslationProject, 'id' | 'createdAt'>): Promise<TranslationProject> {
    const response = await this.apiClient.post<ApiResponse<TranslationProject>>('/projects', project);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create project');
    }
    return response.data.data!;
  }

  // Statistics
  async getStats(): Promise<TranslationStats> {
    const response = await this.apiClient.get<ApiResponse<TranslationStats>>('/stats');
    return response.data.data || this.getEmptyStats();
  }

  // Auto-translation
  async startAutoTranslation(params: {
    contentType: string;
    entityIds: string[];
    targetLanguages: string[];
    provider: string;
  }): Promise<TranslationJob> {
    const response = await this.apiClient.post<ApiResponse<TranslationJob>>('/auto-translate', params);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to start auto-translation');
    }
    return response.data.data!;
  }

  // Saleor integration
  async discoverContent(contentType: string): Promise<{ discovered: number; added: number }> {
    const response = await this.apiClient.post<ApiResponse<{ discovered: number; added: number }>>('/discover-content', {
      contentType
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to discover content');
    }
    return response.data.data!;
  }

  async syncToSaleor(translationIds: string[]): Promise<{ synced: number; failed: number }> {
    const response = await this.apiClient.post<ApiResponse<{ synced: number; failed: number }>>('/sync-to-saleor', {
      translationIds
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to sync to Saleor');
    }
    return response.data.data!;
  }

  private getEmptyStats(): TranslationStats {
    return {
      totalTranslations: 0,
      completedTranslations: 0,
      pendingTranslations: 0,
      failedTranslations: 0,
      translationsByLanguage: {},
      translationsByProvider: {},
      averageTranslationTime: 0,
      charactersTranslated: 0,
    };
  }
}

export const translationService = new TranslationService();