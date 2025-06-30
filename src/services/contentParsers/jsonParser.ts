import { ContentParser, ExtractedText, ContentType } from '../../types';

export class JsonParser implements ContentParser {
  type = ContentType.JSON;

  validate(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  parse(content: string): ExtractedText[] {
    const extractedTexts: ExtractedText[] = [];
    
    try {
      const jsonData = JSON.parse(content);
      this.extractFromObject(jsonData, '', extractedTexts);
    } catch (error) {
      console.error('Error parsing JSON content:', error);
    }
    
    return extractedTexts;
  }

  private extractFromObject(obj: any, path: string, extractedTexts: ExtractedText[], context = 'JSON'): void {
    if (obj === null || obj === undefined) return;
    
    if (typeof obj === 'string') {
      if (this.isTextualContent(obj)) {
        extractedTexts.push({
          id: path,
          originalText: obj,
          path: path,
          context: context,
          type: 'text'
        });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.extractFromObject(item, `${path}[${index}]`, extractedTexts, `${context} array item`);
      });
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        const newContext = this.getContextForKey(key, context);
        this.extractFromObject(obj[key], newPath, extractedTexts, newContext);
      });
    }
  }

  private getContextForKey(key: string, parentContext: string): string {
    const textualKeys = ['text', 'content', 'message', 'title', 'description', 'label', 'caption', 'alt', 'placeholder'];
    
    if (textualKeys.some(textKey => key.toLowerCase().includes(textKey))) {
      return `${parentContext} ${key}`;
    }
    
    return `${parentContext} ${key}`;
  }

  private isTextualContent(value: string): boolean {
    // Skip URLs, IDs, and other non-textual content
    const urlPattern = /^https?:\/\//i;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const idPattern = /^[a-f0-9-]{8,}$/i;
    
    return value.trim().length > 2 && 
           !urlPattern.test(value) && 
           !emailPattern.test(value) &&
           !idPattern.test(value);
  }

  reconstruct(originalContent: string, translations: ExtractedText[]): string {
    try {
      const jsonData = JSON.parse(originalContent);
      const translationMap = new Map(translations.map(t => [t.path, t.translatedText || t.originalText]));
      
      this.reconstructObject(jsonData, '', translationMap);
      
      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      console.error('Error reconstructing JSON content:', error);
      return originalContent;
    }
  }

  private reconstructObject(obj: any, path: string, translationMap: Map<string, string>): void {
    if (obj === null || obj === undefined) return;
    
    if (typeof obj === 'string') {
      // This case is handled by the parent object
      return;
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        if (translationMap.has(itemPath)) {
          obj[index] = translationMap.get(itemPath);
        } else {
          this.reconstructObject(item, itemPath, translationMap);
        }
      });
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        if (translationMap.has(newPath)) {
          obj[key] = translationMap.get(newPath);
        } else {
          this.reconstructObject(obj[key], newPath, translationMap);
        }
      });
    }
  }
}