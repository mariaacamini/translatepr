export interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  status: TranslationStatus;
  provider: TranslationProvider;
  createdAt: string;
  updatedAt: string;
  contentType: ContentType;
  metadata?: {
    contentType: string;
    entityId: string;
    field: string;
    originalStructure?: any;
    preserveFormatting?: boolean;
    extractedTexts?: ExtractedText[];
  };
}

export enum TranslationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVIEW_NEEDED = 'REVIEW_NEEDED',
  APPROVED = 'APPROVED'
}

export enum TranslationProvider {
  DEEPL = 'DEEPL',
  GOOGLE = 'GOOGLE',
  MANUAL = 'MANUAL'
}

export enum ContentType {
  PLAIN_TEXT = 'PLAIN_TEXT',
  HTML = 'HTML',
  MARKDOWN = 'MARKDOWN',
  EDITOR_JS = 'EDITOR_JS',
  GRAPE_JS = 'GRAPE_JS',
  JSON = 'JSON',
  RICH_TEXT = 'RICH_TEXT',
  STRUCTURED_DATA = 'STRUCTURED_DATA'
}

export interface ExtractedText {
  id: string;
  originalText: string;
  translatedText?: string;
  path: string;
  context: string;
  type: 'text' | 'alt' | 'title' | 'placeholder' | 'meta';
}

export interface ContentParser {
  type: ContentType;
  parse: (content: string) => ExtractedText[];
  reconstruct: (originalContent: string, translations: ExtractedText[]) => string;
  validate: (content: string) => boolean;
}

export interface EditorJSBlock {
  id?: string;
  type: string;
  data: {
    text?: string;
    caption?: string;
    title?: string;
    message?: string;
    items?: string[];
    content?: EditorJSBlock[];
    [key: string]: any;
  };
}

export interface EditorJSContent {
  time?: number;
  blocks: EditorJSBlock[];
  version?: string;
}

export interface GrapeJSComponent {
  tagName?: string;
  type?: string;
  content?: string;
  components?: GrapeJSComponent[];
  attributes?: Record<string, any>;
  traits?: any[];
  [key: string]: any;
}

export interface TranslationJob {
  id: string;
  status: TranslationStatus;
  progress: number;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  targetLanguages: string[];
  contentType: string;
  createdAt: string;
  estimatedCompletion?: string;
  contentTypes?: ContentType[];
  extractedTextsCount?: number;
}

export interface TranslationProject {
  id: string;
  name: string;
  sourceLanguage: string;
  targetLanguages: string[];
  status: 'active' | 'paused' | 'completed';
  progress: number;
  totalTranslations: number;
  completedTranslations: number;
  createdAt: string;
  supportedContentTypes?: ContentType[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface TranslationStats {
  totalTranslations: number;
  completedTranslations: number;
  pendingTranslations: number;
  failedTranslations: number;
  translationsByLanguage: Record<string, number>;
  translationsByProvider: Record<string, number>;
  translationsByContentType: Record<ContentType, number>;
  averageTranslationTime: number;
  charactersTranslated: number;
}

export interface SaleorProduct {
  id: string;
  name: string;
  description: string;
  slug: string;
  category?: {
    id: string;
    name: string;
  };
  attributes: Array<{
    attribute: {
      id: string;
      name: string;
    };
    values: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

export interface SaleorCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  parent?: {
    id: string;
    name: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}