import { translationService } from './translationService';
import { ContentParserFactory } from './contentParsers';
import { Translation, ExtractedText, ContentType, TranslationStatus, TranslationProvider } from '../types';

export class EnhancedTranslationService {
  async processStructuredContent(
    content: string,
    sourceLanguage: string,
    targetLanguage: string,
    context: string,
    contentType?: ContentType
  ): Promise<Translation> {
    // Auto-detect content type if not provided
    const parser = contentType 
      ? ContentParserFactory.getParserByType(contentType)
      : ContentParserFactory.getParser(content);

    if (!parser) {
      // Fallback to plain text translation
      return this.createPlainTextTranslation(content, sourceLanguage, targetLanguage, context);
    }

    // Extract translatable texts
    const extractedTexts = parser.parse(content);
    
    if (extractedTexts.length === 0) {
      return this.createPlainTextTranslation(content, sourceLanguage, targetLanguage, context);
    }

    // Translate each extracted text
    const translatedTexts = await this.translateExtractedTexts(
      extractedTexts,
      sourceLanguage,
      targetLanguage
    );

    // Reconstruct the content with translations
    const translatedContent = parser.reconstruct(content, translatedTexts);

    // Create translation record
    const translation: Translation = {
      id: this.generateId(),
      sourceText: content,
      translatedText: translatedContent,
      sourceLanguage,
      targetLanguage,
      context,
      status: TranslationStatus.COMPLETED,
      provider: TranslationProvider.DEEPL,
      contentType: parser.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        contentType: parser.type,
        entityId: context,
        field: 'content',
        originalStructure: this.analyzeStructure(content, parser.type),
        preserveFormatting: true,
        extractedTexts: translatedTexts
      }
    };

    return translation;
  }

  async translateExtractedTexts(
    extractedTexts: ExtractedText[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<ExtractedText[]> {
    const batchSize = 10;
    const results: ExtractedText[] = [];

    for (let i = 0; i < extractedTexts.length; i += batchSize) {
      const batch = extractedTexts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (extracted) => {
        try {
          // Use existing translation service for individual text translation
          const translation = await translationService.createTranslation({
            sourceText: extracted.originalText,
            translatedText: '',
            sourceLanguage,
            targetLanguage,
            context: extracted.context,
            status: TranslationStatus.PENDING,
            provider: TranslationProvider.DEEPL,
            contentType: ContentType.PLAIN_TEXT,
            metadata: {
              contentType: 'extracted_text',
              entityId: extracted.id,
              field: extracted.type
            }
          });

          return {
            ...extracted,
            translatedText: translation.translatedText
          };
        } catch (error) {
          console.error(`Failed to translate text: ${extracted.originalText}`, error);
          return {
            ...extracted,
            translatedText: extracted.originalText // Fallback to original
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect API limits
      if (i + batchSize < extractedTexts.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  async bulkProcessContent(
    contentItems: Array<{
      content: string;
      context: string;
      contentType?: ContentType;
    }>,
    sourceLanguage: string,
    targetLanguages: string[]
  ): Promise<Translation[]> {
    const results: Translation[] = [];

    for (const item of contentItems) {
      for (const targetLanguage of targetLanguages) {
        try {
          const translation = await this.processStructuredContent(
            item.content,
            sourceLanguage,
            targetLanguage,
            item.context,
            item.contentType
          );
          results.push(translation);
        } catch (error) {
          console.error(`Failed to process content for ${targetLanguage}:`, error);
          // Create failed translation record
          results.push({
            id: this.generateId(),
            sourceText: item.content,
            translatedText: '',
            sourceLanguage,
            targetLanguage,
            context: item.context,
            status: TranslationStatus.FAILED,
            provider: TranslationProvider.DEEPL,
            contentType: item.contentType || ContentType.PLAIN_TEXT,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              contentType: item.contentType || ContentType.PLAIN_TEXT,
              entityId: item.context,
              field: 'content',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }
    }

    return results;
  }

  async validateTranslation(translation: Translation): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Validate based on content type
    if (translation.contentType && translation.metadata?.originalStructure) {
      const parser = ContentParserFactory.getParserByType(translation.contentType);
      
      if (parser) {
        // Check if translated content maintains structure
        if (!parser.validate(translation.translatedText)) {
          issues.push(`Translated content doesn't maintain ${translation.contentType} structure`);
          suggestions.push('Review the translation to ensure proper formatting is preserved');
        }

        // Check if all extracted texts were translated
        const originalTexts = parser.parse(translation.sourceText);
        const translatedTexts = parser.parse(translation.translatedText);

        if (originalTexts.length !== translatedTexts.length) {
          issues.push('Number of translatable elements changed during translation');
          suggestions.push('Verify that all text elements are properly translated');
        }
      }
    }

    // Check for common translation issues
    if (translation.translatedText === translation.sourceText) {
      issues.push('Translation appears to be identical to source text');
      suggestions.push('Verify that translation was actually performed');
    }

    if (translation.translatedText.length === 0) {
      issues.push('Translation is empty');
      suggestions.push('Ensure translation service is working correctly');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  async optimizeForContentType(
    content: string,
    contentType: ContentType,
    targetLanguage: string
  ): Promise<{
    optimizedContent: string;
    optimizations: string[];
  }> {
    const optimizations: string[] = [];
    let optimizedContent = content;

    switch (contentType) {
      case ContentType.EDITOR_JS:
        // Optimize Editor.js content for better translation
        optimizedContent = this.optimizeEditorJsContent(content);
        optimizations.push('Optimized Editor.js block structure for translation');
        break;

      case ContentType.GRAPE_JS:
        // Optimize GrapeJS content
        optimizedContent = this.optimizeGrapeJsContent(content);
        optimizations.push('Optimized GrapeJS component structure for translation');
        break;

      case ContentType.HTML:
        // Optimize HTML content
        optimizedContent = this.optimizeHtmlContent(content, targetLanguage);
        optimizations.push('Added language attributes and optimized HTML structure');
        break;

      case ContentType.MARKDOWN:
        // Optimize Markdown content
        optimizedContent = this.optimizeMarkdownContent(content);
        optimizations.push('Optimized Markdown formatting for translation');
        break;

      default:
        optimizations.push('No specific optimizations applied');
    }

    return {
      optimizedContent,
      optimizations
    };
  }

  private optimizeEditorJsContent(content: string): string {
    try {
      const editorData = JSON.parse(content);
      
      // Add translation metadata to blocks
      editorData.blocks = editorData.blocks.map((block: any) => ({
        ...block,
        tunes: {
          ...block.tunes,
          translation: {
            translatable: true,
            priority: this.getBlockTranslationPriority(block.type)
          }
        }
      }));

      return JSON.stringify(editorData, null, 2);
    } catch {
      return content;
    }
  }

  private optimizeGrapeJsContent(content: string): string {
    try {
      const grapeData = JSON.parse(content);
      const components = Array.isArray(grapeData) ? grapeData : grapeData.components || [];
      
      // Add translation attributes to components
      const optimizedComponents = this.addTranslationAttributesToComponents(components);
      
      if (Array.isArray(grapeData)) {
        return JSON.stringify(optimizedComponents, null, 2);
      } else {
        return JSON.stringify({ ...grapeData, components: optimizedComponents }, null, 2);
      }
    } catch {
      return content;
    }
  }

  private optimizeHtmlContent(content: string, targetLanguage: string): string {
    // Add language attributes and optimize for translation
    let optimized = content;
    
    // Add lang attribute to html tag if missing
    if (!optimized.includes('lang=')) {
      optimized = optimized.replace(/<html([^>]*)>/i, `<html$1 lang="${targetLanguage}">`);
    }
    
    // Add dir attribute for RTL languages
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    if (rtlLanguages.includes(targetLanguage)) {
      optimized = optimized.replace(/<html([^>]*)>/i, `<html$1 dir="rtl">`);
    }
    
    return optimized;
  }

  private optimizeMarkdownContent(content: string): string {
    // Add translation comments for complex sections
    return content.replace(/^(#{1,6}\s+.+)$/gm, (match) => {
      return `${match}\n<!-- Translation: Header -->\n`;
    });
  }

  private addTranslationAttributesToComponents(components: any[]): any[] {
    return components.map(component => ({
      ...component,
      attributes: {
        ...component.attributes,
        'data-translatable': 'true',
        'data-translation-priority': this.getComponentTranslationPriority(component)
      },
      components: component.components 
        ? this.addTranslationAttributesToComponents(component.components)
        : undefined
    }));
  }

  private getBlockTranslationPriority(blockType: string): number {
    const priorities: Record<string, number> = {
      'header': 10,
      'paragraph': 8,
      'quote': 7,
      'list': 6,
      'table': 5,
      'image': 3,
      'embed': 2
    };
    return priorities[blockType] || 5;
  }

  private getComponentTranslationPriority(component: any): number {
    if (component.tagName === 'h1' || component.tagName === 'h2') return 10;
    if (component.tagName === 'p') return 8;
    if (component.type === 'text') return 7;
    if (component.type === 'image') return 3;
    return 5;
  }

  private createPlainTextTranslation(
    content: string,
    sourceLanguage: string,
    targetLanguage: string,
    context: string
  ): Promise<Translation> {
    return translationService.createTranslation({
      sourceText: content,
      translatedText: '',
      sourceLanguage,
      targetLanguage,
      context,
      status: TranslationStatus.PENDING,
      provider: TranslationProvider.DEEPL,
      contentType: ContentType.PLAIN_TEXT,
      metadata: {
        contentType: ContentType.PLAIN_TEXT,
        entityId: context,
        field: 'content'
      }
    });
  }

  private analyzeStructure(content: string, contentType: ContentType): any {
    try {
      switch (contentType) {
        case ContentType.EDITOR_JS:
        case ContentType.GRAPE_JS:
        case ContentType.JSON:
          return JSON.parse(content);
        default:
          return { type: contentType, length: content.length };
      }
    } catch {
      return { type: contentType, length: content.length };
    }
  }

  private generateId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const enhancedTranslationService = new EnhancedTranslationService();