import { create } from 'zustand';
import { Translation, TranslationJob, TranslationProject, TranslationStats, TranslationStatus } from '../types';

interface TranslationStore {
  // State
  translations: Translation[];
  jobs: TranslationJob[];
  projects: TranslationProject[];
  stats: TranslationStats | null;
  currentProject: TranslationProject | null;
  selectedLanguages: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTranslations: (translations: Translation[]) => void;
  addTranslation: (translation: Translation) => void;
  updateTranslation: (id: string, updates: Partial<Translation>) => void;
  deleteTranslation: (id: string) => void;
  setJobs: (jobs: TranslationJob[]) => void;
  addJob: (job: TranslationJob) => void;
  updateJob: (id: string, updates: Partial<TranslationJob>) => void;
  setProjects: (projects: TranslationProject[]) => void;
  setCurrentProject: (project: TranslationProject | null) => void;
  setStats: (stats: TranslationStats) => void;
  setSelectedLanguages: (languages: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getPendingTranslations: () => Translation[];
  getCompletedTranslations: () => Translation[];
  getTranslationsByLanguage: (languageCode: string) => Translation[];
  getActiveJobs: () => TranslationJob[];
}

export const useTranslationStore = create<TranslationStore>((set, get) => ({
  // Initial state
  translations: [],
  jobs: [],
  projects: [],
  stats: null,
  currentProject: null,
  selectedLanguages: ['en'],
  isLoading: false,
  error: null,

  // Actions
  setTranslations: (translations) => set({ translations }),
  
  addTranslation: (translation) => 
    set((state) => ({ translations: [...state.translations, translation] })),
  
  updateTranslation: (id, updates) =>
    set((state) => ({
      translations: state.translations.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  
  deleteTranslation: (id) =>
    set((state) => ({
      translations: state.translations.filter((t) => t.id !== id),
    })),
  
  setJobs: (jobs) => set({ jobs }),
  
  addJob: (job) =>
    set((state) => ({ jobs: [...state.jobs, job] })),
  
  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    })),
  
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setStats: (stats) => set({ stats }),
  setSelectedLanguages: (selectedLanguages) => set({ selectedLanguages }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Computed values
  getPendingTranslations: () => {
    const { translations } = get();
    return translations.filter(t => t.status === TranslationStatus.PENDING);
  },
  
  getCompletedTranslations: () => {
    const { translations } = get();
    return translations.filter(t => t.status === TranslationStatus.COMPLETED);
  },
  
  getTranslationsByLanguage: (languageCode) => {
    const { translations } = get();
    return translations.filter(t => t.targetLanguage === languageCode);
  },
  
  getActiveJobs: () => {
    const { jobs } = get();
    return jobs.filter(j => 
      j.status === TranslationStatus.PENDING || 
      j.status === TranslationStatus.IN_PROGRESS
    );
  },
}));