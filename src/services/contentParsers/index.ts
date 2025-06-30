import { ContentParser, ContentType } from '../../types';
import { EditorJSParser } from './editorJsParser';
import { GrapeJSParser } from './grapeJsParser';
import { HtmlParser } from './htmlParser';
import { JsonParser } from './jsonParser';
import { MarkdownParser } from './markdownParser';

export class ContentParserFactory {
  private static parsers: ContentParser[] = [
    new EditorJSParser(),
    new GrapeJSParser(),
    new HtmlParser(),
    new JsonParser(),
    new MarkdownParser(),
  ];

  static getParser(content: string): ContentParser | null {
    // Try to detect content type automatically
    for (const parser of this.parsers) {
      if (parser.validate(content)) {
        return parser;
      }
    }
    
    // Fallback to plain text if no parser matches
    return null;
  }

  static getParserByType(contentType: ContentType): ContentParser | null {
    return this.parsers.find(parser => parser.type === contentType) || null;
  }

  static getAllParsers(): ContentParser[] {
    return [...this.parsers];
  }

  static registerParser(parser: ContentParser): void {
    this.parsers.push(parser);
  }
}

export * from './editorJsParser';
export * from './grapeJsParser';
export * from './htmlParser';
export * from './jsonParser';
export * from './markdownParser';