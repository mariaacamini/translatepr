import { ContentParser, ExtractedText, GrapeJSComponent, ContentType } from '../../types';

export class GrapeJSParser implements ContentParser {
  type = ContentType.GRAPE_JS;

  validate(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return parsed && (Array.isArray(parsed) || (parsed.components && Array.isArray(parsed.components)));
    } catch {
      return false;
    }
  }

  parse(content: string): ExtractedText[] {
    const extractedTexts: ExtractedText[] = [];
    
    try {
      const grapeData = JSON.parse(content);
      const components = Array.isArray(grapeData) ? grapeData : grapeData.components || [];
      
      components.forEach((component, index) => {
        this.extractFromComponent(component, `[${index}]`, extractedTexts);
      });
      
    } catch (error) {
      console.error('Error parsing GrapeJS content:', error);
    }
    
    return extractedTexts;
  }

  private extractFromComponent(component: GrapeJSComponent, path: string, extractedTexts: ExtractedText[]): void {
    // Extract text content
    if (component.content && typeof component.content === 'string') {
      const textContent = this.stripHtml(component.content);
      if (textContent.trim()) {
        extractedTexts.push({
          id: `${path}.content`,
          originalText: textContent,
          path: `${path}.content`,
          context: this.getComponentContext(component),
          type: 'text'
        });
      }
    }

    // Extract attributes that contain text
    if (component.attributes) {
      this.extractFromAttributes(component.attributes, `${path}.attributes`, extractedTexts, component);
    }

    // Extract from traits (GrapeJS component properties)
    if (component.traits) {
      component.traits.forEach((trait, traitIndex) => {
        if (trait.value && typeof trait.value === 'string' && this.isTextualContent(trait.name, trait.value)) {
          extractedTexts.push({
            id: `${path}.traits[${traitIndex}].value`,
            originalText: trait.value,
            path: `${path}.traits[${traitIndex}].value`,
            context: `${this.getComponentContext(component)} ${trait.name}`,
            type: this.getAttributeType(trait.name)
          });
        }
      });
    }

    // Recursively extract from child components
    if (component.components && Array.isArray(component.components)) {
      component.components.forEach((child, childIndex) => {
        this.extractFromComponent(child, `${path}.components[${childIndex}]`, extractedTexts);
      });
    }
  }

  private extractFromAttributes(attributes: Record<string, any>, basePath: string, extractedTexts: ExtractedText[], component: GrapeJSComponent): void {
    const textualAttributes = ['alt', 'title', 'placeholder', 'aria-label', 'data-text', 'value'];
    
    Object.keys(attributes).forEach(key => {
      const value = attributes[key];
      
      if (typeof value === 'string' && value.trim()) {
        if (textualAttributes.includes(key) || this.isTextualContent(key, value)) {
          extractedTexts.push({
            id: `${basePath}.${key}`,
            originalText: value,
            path: `${basePath}.${key}`,
            context: `${this.getComponentContext(component)} ${key}`,
            type: this.getAttributeType(key)
          });
        }
      }
    });
  }

  private getComponentContext(component: GrapeJSComponent): string {
    if (component.type) {
      return `${component.type} component`;
    }
    if (component.tagName) {
      return `${component.tagName} element`;
    }
    return 'component';
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

  private isTextualContent(key: string, value: string): boolean {
    const nonTextualKeys = ['id', 'class', 'src', 'href', 'url', 'link', 'style', 'width', 'height'];
    const urlPattern = /^https?:\/\//i;
    const colorPattern = /^#[0-9a-f]{3,6}$/i;
    const numberPattern = /^\d+(\.\d+)?(px|em|rem|%)?$/i;
    
    return !nonTextualKeys.includes(key.toLowerCase()) && 
           !urlPattern.test(value) && 
           !colorPattern.test(value) &&
           !numberPattern.test(value) &&
           value.length > 1;
  }

  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
  }

  reconstruct(originalContent: string, translations: ExtractedText[]): string {
    try {
      const grapeData = JSON.parse(originalContent);
      const components = Array.isArray(grapeData) ? grapeData : grapeData.components || [];
      const translationMap = new Map(translations.map(t => [t.path, t.translatedText || t.originalText]));
      
      components.forEach((component, index) => {
        this.reconstructComponent(component, `[${index}]`, translationMap);
      });
      
      if (Array.isArray(grapeData)) {
        return JSON.stringify(components, null, 2);
      } else {
        return JSON.stringify({ ...grapeData, components }, null, 2);
      }
    } catch (error) {
      console.error('Error reconstructing GrapeJS content:', error);
      return originalContent;
    }
  }

  private reconstructComponent(component: GrapeJSComponent, path: string, translationMap: Map<string, string>): void {
    // Update text content
    const contentPath = `${path}.content`;
    if (translationMap.has(contentPath)) {
      component.content = translationMap.get(contentPath);
    }

    // Update attributes
    if (component.attributes) {
      Object.keys(component.attributes).forEach(key => {
        const attrPath = `${path}.attributes.${key}`;
        if (translationMap.has(attrPath)) {
          component.attributes![key] = translationMap.get(attrPath);
        }
      });
    }

    // Update traits
    if (component.traits) {
      component.traits.forEach((trait, traitIndex) => {
        const traitPath = `${path}.traits[${traitIndex}].value`;
        if (translationMap.has(traitPath)) {
          trait.value = translationMap.get(traitPath);
        }
      });
    }

    // Recursively update child components
    if (component.components && Array.isArray(component.components)) {
      component.components.forEach((child, childIndex) => {
        this.reconstructComponent(child, `${path}.components[${childIndex}]`, translationMap);
      });
    }
  }
}