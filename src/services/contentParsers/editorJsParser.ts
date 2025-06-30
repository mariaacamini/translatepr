import { ContentParser, ExtractedText, EditorJSContent, EditorJSBlock, ContentType } from '../../types';

export class EditorJSParser implements ContentParser {
  type = ContentType.EDITOR_JS;

  validate(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return parsed && Array.isArray(parsed.blocks);
    } catch {
      return false;
    }
  }

  parse(content: string): ExtractedText[] {
    const extractedTexts: ExtractedText[] = [];
    
    try {
      const editorData: EditorJSContent = JSON.parse(content);
      
      editorData.blocks.forEach((block, blockIndex) => {
        this.extractFromBlock(block, blockIndex, extractedTexts);
      });
      
    } catch (error) {
      console.error('Error parsing Editor.js content:', error);
    }
    
    return extractedTexts;
  }

  private extractFromBlock(block: EditorJSBlock, blockIndex: number, extractedTexts: ExtractedText[]): void {
    const blockPath = `blocks[${blockIndex}]`;
    
    switch (block.type) {
      case 'paragraph':
      case 'header':
        if (block.data.text) {
          extractedTexts.push({
            id: `${blockPath}.data.text`,
            originalText: this.stripHtml(block.data.text),
            path: `${blockPath}.data.text`,
            context: `${block.type} block`,
            type: 'text'
          });
        }
        break;
        
      case 'list':
        if (block.data.items) {
          block.data.items.forEach((item, itemIndex) => {
            extractedTexts.push({
              id: `${blockPath}.data.items[${itemIndex}]`,
              originalText: this.stripHtml(item),
              path: `${blockPath}.data.items[${itemIndex}]`,
              context: `${block.data.style || 'unordered'} list item`,
              type: 'text'
            });
          });
        }
        break;
        
      case 'quote':
        if (block.data.text) {
          extractedTexts.push({
            id: `${blockPath}.data.text`,
            originalText: this.stripHtml(block.data.text),
            path: `${blockPath}.data.text`,
            context: 'quote text',
            type: 'text'
          });
        }
        if (block.data.caption) {
          extractedTexts.push({
            id: `${blockPath}.data.caption`,
            originalText: this.stripHtml(block.data.caption),
            path: `${blockPath}.data.caption`,
            context: 'quote caption',
            type: 'text'
          });
        }
        break;
        
      case 'image':
      case 'embed':
        if (block.data.caption) {
          extractedTexts.push({
            id: `${blockPath}.data.caption`,
            originalText: block.data.caption,
            path: `${blockPath}.data.caption`,
            context: `${block.type} caption`,
            type: 'text'
          });
        }
        break;
        
      case 'table':
        if (block.data.content) {
          block.data.content.forEach((row: string[], rowIndex: number) => {
            row.forEach((cell, cellIndex) => {
              if (cell.trim()) {
                extractedTexts.push({
                  id: `${blockPath}.data.content[${rowIndex}][${cellIndex}]`,
                  originalText: this.stripHtml(cell),
                  path: `${blockPath}.data.content[${rowIndex}][${cellIndex}]`,
                  context: `table cell (${rowIndex + 1}, ${cellIndex + 1})`,
                  type: 'text'
                });
              }
            });
          });
        }
        break;
        
      case 'checklist':
        if (block.data.items) {
          block.data.items.forEach((item: any, itemIndex: number) => {
            if (item.text) {
              extractedTexts.push({
                id: `${blockPath}.data.items[${itemIndex}].text`,
                originalText: this.stripHtml(item.text),
                path: `${blockPath}.data.items[${itemIndex}].text`,
                context: 'checklist item',
                type: 'text'
              });
            }
          });
        }
        break;
        
      case 'warning':
      case 'alert':
        if (block.data.title) {
          extractedTexts.push({
            id: `${blockPath}.data.title`,
            originalText: block.data.title,
            path: `${blockPath}.data.title`,
            context: `${block.type} title`,
            type: 'text'
          });
        }
        if (block.data.message) {
          extractedTexts.push({
            id: `${blockPath}.data.message`,
            originalText: block.data.message,
            path: `${blockPath}.data.message`,
            context: `${block.type} message`,
            type: 'text'
          });
        }
        break;
        
      default:
        // Handle custom blocks by extracting any text-like properties
        this.extractGenericTextFields(block.data, blockPath, extractedTexts, block.type);
    }
  }

  private extractGenericTextFields(data: any, basePath: string, extractedTexts: ExtractedText[], blockType: string): void {
    if (!data || typeof data !== 'object') return;
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      const currentPath = `${basePath}.data.${key}`;
      
      if (typeof value === 'string' && value.trim() && this.isTextualContent(key, value)) {
        extractedTexts.push({
          id: currentPath,
          originalText: this.stripHtml(value),
          path: currentPath,
          context: `${blockType} ${key}`,
          type: 'text'
        });
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'string' && item.trim()) {
            extractedTexts.push({
              id: `${currentPath}[${index}]`,
              originalText: this.stripHtml(item),
              path: `${currentPath}[${index}]`,
              context: `${blockType} ${key} item`,
              type: 'text'
            });
          }
        });
      }
    });
  }

  private isTextualContent(key: string, value: string): boolean {
    // Skip URLs, IDs, and other non-textual content
    const nonTextualKeys = ['url', 'id', 'file', 'src', 'href', 'link', 'embed'];
    const urlPattern = /^https?:\/\//i;
    
    return !nonTextualKeys.includes(key.toLowerCase()) && 
           !urlPattern.test(value) && 
           value.length > 2;
  }

  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
  }

  reconstruct(originalContent: string, translations: ExtractedText[]): string {
    try {
      const editorData: EditorJSContent = JSON.parse(originalContent);
      const translationMap = new Map(translations.map(t => [t.path, t.translatedText || t.originalText]));
      
      editorData.blocks.forEach((block, blockIndex) => {
        this.reconstructBlock(block, blockIndex, translationMap);
      });
      
      return JSON.stringify(editorData, null, 2);
    } catch (error) {
      console.error('Error reconstructing Editor.js content:', error);
      return originalContent;
    }
  }

  private reconstructBlock(block: EditorJSBlock, blockIndex: number, translationMap: Map<string, string>): void {
    const blockPath = `blocks[${blockIndex}]`;
    
    switch (block.type) {
      case 'paragraph':
      case 'header':
        this.updateTextPath(block.data, 'text', `${blockPath}.data.text`, translationMap);
        break;
        
      case 'list':
        if (block.data.items) {
          block.data.items = block.data.items.map((item, itemIndex) => {
            const path = `${blockPath}.data.items[${itemIndex}]`;
            return translationMap.get(path) || item;
          });
        }
        break;
        
      case 'quote':
        this.updateTextPath(block.data, 'text', `${blockPath}.data.text`, translationMap);
        this.updateTextPath(block.data, 'caption', `${blockPath}.data.caption`, translationMap);
        break;
        
      case 'image':
      case 'embed':
        this.updateTextPath(block.data, 'caption', `${blockPath}.data.caption`, translationMap);
        break;
        
      case 'table':
        if (block.data.content) {
          block.data.content = block.data.content.map((row: string[], rowIndex: number) => 
            row.map((cell, cellIndex) => {
              const path = `${blockPath}.data.content[${rowIndex}][${cellIndex}]`;
              return translationMap.get(path) || cell;
            })
          );
        }
        break;
        
      case 'checklist':
        if (block.data.items) {
          block.data.items.forEach((item: any, itemIndex: number) => {
            const path = `${blockPath}.data.items[${itemIndex}].text`;
            if (translationMap.has(path)) {
              item.text = translationMap.get(path);
            }
          });
        }
        break;
        
      case 'warning':
      case 'alert':
        this.updateTextPath(block.data, 'title', `${blockPath}.data.title`, translationMap);
        this.updateTextPath(block.data, 'message', `${blockPath}.data.message`, translationMap);
        break;
        
      default:
        this.reconstructGenericTextFields(block.data, blockPath, translationMap);
    }
  }

  private updateTextPath(data: any, key: string, path: string, translationMap: Map<string, string>): void {
    if (translationMap.has(path)) {
      data[key] = translationMap.get(path);
    }
  }

  private reconstructGenericTextFields(data: any, basePath: string, translationMap: Map<string, string>): void {
    if (!data || typeof data !== 'object') return;
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      const currentPath = `${basePath}.data.${key}`;
      
      if (typeof value === 'string' && translationMap.has(currentPath)) {
        data[key] = translationMap.get(currentPath);
      } else if (Array.isArray(value)) {
        data[key] = value.map((item, index) => {
          const itemPath = `${currentPath}[${index}]`;
          return translationMap.has(itemPath) ? translationMap.get(itemPath) : item;
        });
      }
    });
  }
}