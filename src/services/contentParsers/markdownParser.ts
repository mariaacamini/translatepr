import { ContentParser, ExtractedText, ContentType } from '../../types';

export class MarkdownParser implements ContentParser {
  type = ContentType.MARKDOWN;

  validate(content: string): boolean {
    // Check for common markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s+/m,  // Headers
      /\*\*.*\*\*/,   // Bold
      /\*.*\*/,       // Italic
      /\[.*\]\(.*\)/, // Links
      /^[-*+]\s+/m,   // Lists
      /^>\s+/m,       // Blockquotes
      /```[\s\S]*```/, // Code blocks
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
  }

  parse(content: string): ExtractedText[] {
    const extractedTexts: ExtractedText[] = [];
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let codeBlockFence = '';
    
    lines.forEach((line, lineIndex) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockFence = line.trim();
        } else if (line.trim() === codeBlockFence || line.trim() === '```') {
          inCodeBlock = false;
          codeBlockFence = '';
        }
        return;
      }
      
      // Skip content inside code blocks
      if (inCodeBlock) return;
      
      // Extract different markdown elements
      this.extractHeaders(line, lineIndex, extractedTexts);
      this.extractLinks(line, lineIndex, extractedTexts);
      this.extractImages(line, lineIndex, extractedTexts);
      this.extractBlockquotes(line, lineIndex, extractedTexts);
      this.extractListItems(line, lineIndex, extractedTexts);
      this.extractPlainText(line, lineIndex, extractedTexts);
    });
    
    return extractedTexts;
  }

  private extractHeaders(line: string, lineIndex: number, extractedTexts: ExtractedText[]): void {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].trim();
      extractedTexts.push({
        id: `line_${lineIndex}_header`,
        originalText: text,
        path: `line_${lineIndex}_header`,
        context: `H${level} header`,
        type: 'text'
      });
    }
  }

  private extractLinks(line: string, lineIndex: number, extractedTexts: ExtractedText[]): void {
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    let match;
    let linkIndex = 0;
    
    while ((match = linkRegex.exec(line)) !== null) {
      const linkText = match[1];
      extractedTexts.push({
        id: `line_${lineIndex}_link_${linkIndex}`,
        originalText: linkText,
        path: `line_${lineIndex}_link_${linkIndex}`,
        context: 'link text',
        type: 'text'
      });
      linkIndex++;
    }
  }

  private extractImages(line: string, lineIndex: number, extractedTexts: ExtractedText[]): void {
    const imageRegex = /!\[([^\]]*)\]\([^)]+\)/g;
    let match;
    let imageIndex = 0;
    
    while ((match = imageRegex.exec(line)) !== null) {
      const altText = match[1];
      if (altText.trim()) {
        extractedTexts.push({
          id: `line_${lineIndex}_image_${imageIndex}`,
          originalText: altText,
          path: `line_${lineIndex}_image_${imageIndex}`,
          context: 'image alt text',
          type: 'alt'
        });
      }
      imageIndex++;
    }
  }

  private extractBlockquotes(line: string, lineIndex: number, extractedTexts: ExtractedText[]): void {
    const blockquoteMatch = line.match(/^>\s*(.+)$/);
    if (blockquoteMatch) {
      const text = blockquoteMatch[1].trim();
      extractedTexts.push({
        id: `line_${lineIndex}_blockquote`,
        originalText: text,
        path: `line_${lineIndex}_blockquote`,
        context: 'blockquote',
        type: 'text'
      });
    }
  }

  private extractListItems(line: string, lineIndex: number, extractedTexts: ExtractedText[]): void {
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const text = listMatch[3].trim();
      const isOrdered = /\d+\./.test(listMatch[2]);
      extractedTexts.push({
        id: `line_${lineIndex}_list_item`,
        originalText: text,
        path: `line_${lineIndex}_list_item`,
        context: `${isOrdered ? 'ordered' : 'unordered'} list item`,
        type: 'text'
      });
    }
  }

  private extractPlainText(line: string, lineIndex: number, extractedTexts: ExtractedText[]): void {
    // Skip if line is already processed as a special element
    if (line.match(/^#{1,6}\s+/) || line.match(/^>\s+/) || line.match(/^(\s*)([-*+]|\d+\.)\s+/)) {
      return;
    }
    
    // Remove markdown formatting and extract plain text
    let cleanText = line
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold
      .replace(/\*([^*]+)\*/g, '$1')      // Italic
      .replace(/`([^`]+)`/g, '$1')        // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')   // Images
      .trim();
    
    if (cleanText && cleanText.length > 2) {
      extractedTexts.push({
        id: `line_${lineIndex}_text`,
        originalText: cleanText,
        path: `line_${lineIndex}_text`,
        context: 'paragraph text',
        type: 'text'
      });
    }
  }

  reconstruct(originalContent: string, translations: ExtractedText[]): string {
    const translationMap = new Map(translations.map(t => [t.originalText, t.translatedText || t.originalText]));
    let reconstructed = originalContent;
    
    translations.forEach(translation => {
      if (translation.translatedText && translation.translatedText !== translation.originalText) {
        const escapedOriginal = this.escapeRegex(translation.originalText);
        
        // Replace based on context
        switch (translation.type) {
          case 'alt':
            // Replace in image alt text
            const imageRegex = new RegExp(`(!\\[)(${escapedOriginal})(\\]\\([^)]+\\))`, 'g');
            reconstructed = reconstructed.replace(imageRegex, `$1${translation.translatedText}$3`);
            break;
            
          default:
            // Replace in various contexts while preserving markdown formatting
            const textRegex = new RegExp(`\\b${escapedOriginal}\\b`, 'g');
            reconstructed = reconstructed.replace(textRegex, translation.translatedText);
        }
      }
    });
    
    return reconstructed;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}