import { ContentParser, ExtractedText, ContentType } from '../../types';

export class HtmlParser implements ContentParser {
  type = ContentType.HTML;

  validate(content: string): boolean {
    // Check if content contains HTML tags
    return /<[^>]+>/.test(content);
  }

  parse(content: string): ExtractedText[] {
    const extractedTexts: ExtractedText[] = [];
    
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      this.extractFromElement(tempDiv, '', extractedTexts);
      
    } catch (error) {
      console.error('Error parsing HTML content:', error);
      // Fallback: extract text using regex
      this.extractWithRegex(content, extractedTexts);
    }
    
    return extractedTexts;
  }

  private extractFromElement(element: Element, path: string, extractedTexts: ExtractedText[]): void {
    // Extract text content from text nodes
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 1) {
          extractedTexts.push({
            id: `${path}textNode[${i}]`,
            originalText: text,
            path: `${path}textNode[${i}]`,
            context: `text in ${element.tagName?.toLowerCase() || 'element'}`,
            type: 'text'
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as Element;
        const childPath = `${path}${childElement.tagName.toLowerCase()}[${i}].`;
        
        // Extract attributes
        this.extractAttributes(childElement, childPath, extractedTexts);
        
        // Recursively extract from child elements
        this.extractFromElement(childElement, childPath, extractedTexts);
      }
    }
  }

  private extractAttributes(element: Element, path: string, extractedTexts: ExtractedText[]): void {
    const textualAttributes = ['alt', 'title', 'placeholder', 'aria-label', 'data-text', 'value'];
    
    for (const attr of element.attributes) {
      if (textualAttributes.includes(attr.name) && attr.value.trim()) {
        extractedTexts.push({
          id: `${path}@${attr.name}`,
          originalText: attr.value,
          path: `${path}@${attr.name}`,
          context: `${attr.name} attribute of ${element.tagName.toLowerCase()}`,
          type: this.getAttributeType(attr.name)
        });
      }
    }
  }

  private getAttributeType(attributeName: string): 'text' | 'alt' | 'title' | 'placeholder' | 'meta' {
    switch (attributeName.toLowerCase()) {
      case 'alt':
        return 'alt';
      case 'title':
        return 'title';
      case 'placeholder':
        return 'placeholder';
      case 'aria-label':
      case 'data-text':
        return 'meta';
      default:
        return 'text';
    }
  }

  private extractWithRegex(content: string, extractedTexts: ExtractedText[]): void {
    // Extract text between tags
    const textRegex = />([^<]+)</g;
    let match;
    let index = 0;
    
    while ((match = textRegex.exec(content)) !== null) {
      const text = match[1].trim();
      if (text && text.length > 1) {
        extractedTexts.push({
          id: `regex_text_${index}`,
          originalText: text,
          path: `regex_text_${index}`,
          context: 'HTML text content',
          type: 'text'
        });
        index++;
      }
    }
    
    // Extract attribute values
    const attrRegex = /(alt|title|placeholder|aria-label|data-text)=["']([^"']+)["']/g;
    index = 0;
    
    while ((match = attrRegex.exec(content)) !== null) {
      const attrName = match[1];
      const attrValue = match[2].trim();
      if (attrValue) {
        extractedTexts.push({
          id: `regex_attr_${index}`,
          originalText: attrValue,
          path: `regex_attr_${index}`,
          context: `${attrName} attribute`,
          type: this.getAttributeType(attrName)
        });
        index++;
      }
    }
  }

  reconstruct(originalContent: string, translations: ExtractedText[]): string {
    const translationMap = new Map(translations.map(t => [t.originalText, t.translatedText || t.originalText]));
    let reconstructed = originalContent;
    
    // Replace text content
    translations.forEach(translation => {
      if (translation.translatedText && translation.translatedText !== translation.originalText) {
        // Use a more precise replacement strategy
        const escapedOriginal = this.escapeRegex(translation.originalText);
        const regex = new RegExp(`(>\\s*)(${escapedOriginal})(\\s*<)`, 'g');
        reconstructed = reconstructed.replace(regex, `$1${translation.translatedText}$3`);
        
        // Replace in attributes
        const attrRegex = new RegExp(`((?:alt|title|placeholder|aria-label|data-text)=["'])(${escapedOriginal})(["'])`, 'g');
        reconstructed = reconstructed.replace(attrRegex, `$1${translation.translatedText}$3`);
      }
    });
    
    return reconstructed;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}