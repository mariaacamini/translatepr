import React, { useState } from 'react';
import { ExtractedText, ContentType } from '../../types';
import { 
  EyeIcon, 
  CodeBracketIcon, 
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface StructuredContentPreviewProps {
  originalContent: string;
  translatedContent: string;
  extractedTexts: ExtractedText[];
  contentType: ContentType;
  onTextUpdate?: (textId: string, newTranslation: string) => void;
}

export const StructuredContentPreview: React.FC<StructuredContentPreviewProps> = ({
  originalContent,
  translatedContent,
  extractedTexts,
  contentType,
  onTextUpdate
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'extracted'>('preview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderPreview = () => {
    switch (contentType) {
      case ContentType.HTML:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original</h4>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: originalContent }}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Translated</h4>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: translatedContent }}
              />
            </div>
          </div>
        );

      case ContentType.MARKDOWN:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original</h4>
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{originalContent}</pre>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Translated</h4>
              <pre className="whitespace-pre-wrap text-sm text-blue-800">{translatedContent}</pre>
            </div>
          </div>
        );

      case ContentType.EDITOR_JS:
        return renderEditorJsPreview();

      case ContentType.GRAPE_JS:
        return renderGrapeJsPreview();

      default:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original</h4>
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{originalContent}</pre>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Translated</h4>
              <pre className="whitespace-pre-wrap text-sm text-blue-800">{translatedContent}</pre>
            </div>
          </div>
        );
    }
  };

  const renderEditorJsPreview = () => {
    try {
      const originalData = JSON.parse(originalContent);
      const translatedData = JSON.parse(translatedContent);

      return (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Original Editor.js Content</h4>
            <div className="space-y-3">
              {originalData.blocks?.map((block: any, index: number) => (
                <div key={index} className="bg-white border rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">{block.type}</div>
                  {renderEditorJsBlock(block)}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-700 mb-3">Translated Editor.js Content</h4>
            <div className="space-y-3">
              {translatedData.blocks?.map((block: any, index: number) => (
                <div key={index} className="bg-white border border-blue-200 rounded p-3">
                  <div className="text-xs text-blue-500 mb-1">{block.type}</div>
                  {renderEditorJsBlock(block)}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } catch {
      return <div className="text-red-600">Invalid Editor.js format</div>;
    }
  };

  const renderEditorJsBlock = (block: any) => {
    switch (block.type) {
      case 'paragraph':
      case 'header':
        return <div className="text-gray-800">{block.data.text}</div>;
      case 'list':
        return (
          <ul className="list-disc list-inside space-y-1">
            {block.data.items?.map((item: string, i: number) => (
              <li key={i} className="text-gray-800">{item}</li>
            ))}
          </ul>
        );
      case 'quote':
        return (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700">
            {block.data.text}
            {block.data.caption && (
              <cite className="block text-sm text-gray-500 mt-1">— {block.data.caption}</cite>
            )}
          </blockquote>
        );
      default:
        return <pre className="text-xs text-gray-600">{JSON.stringify(block.data, null, 2)}</pre>;
    }
  };

  const renderGrapeJsPreview = () => {
    try {
      const originalData = JSON.parse(originalContent);
      const translatedData = JSON.parse(translatedContent);

      return (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Original GrapeJS Components</h4>
            {renderGrapeJsComponents(Array.isArray(originalData) ? originalData : originalData.components || [])}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-700 mb-3">Translated GrapeJS Components</h4>
            {renderGrapeJsComponents(Array.isArray(translatedData) ? translatedData : translatedData.components || [])}
          </div>
        </div>
      );
    } catch {
      return <div className="text-red-600">Invalid GrapeJS format</div>;
    }
  };

  const renderGrapeJsComponents = (components: any[]) => {
    return (
      <div className="space-y-2">
        {components.map((component, index) => (
          <div key={index} className="bg-white border rounded p-3">
            <div className="text-xs text-gray-500 mb-1">
              {component.tagName || component.type || 'component'}
            </div>
            {component.content && (
              <div className="text-gray-800 mb-2">{component.content}</div>
            )}
            {component.attributes && Object.keys(component.attributes).length > 0 && (
              <div className="text-xs text-gray-600">
                Attributes: {Object.keys(component.attributes).join(', ')}
              </div>
            )}
            {component.components && component.components.length > 0 && (
              <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-3">
                {renderGrapeJsComponents(component.components)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderExtractedTexts = () => {
    const groupedTexts = extractedTexts.reduce((groups, text) => {
      const group = groups[text.context] || [];
      group.push(text);
      groups[text.context] = group;
      return groups;
    }, {} as Record<string, ExtractedText[]>);

    return (
      <div className="space-y-4">
        {Object.entries(groupedTexts).map(([context, texts]) => (
          <div key={context} className="border rounded-lg">
            <button
              onClick={() => toggleSection(context)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-gray-900">{context}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{texts.length} texts</span>
                {expandedSections.has(context) ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedSections.has(context) && (
              <div className="p-4 space-y-3">
                {texts.map((text) => (
                  <div key={text.id} className="bg-white border rounded p-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Original ({text.type})
                        </label>
                        <div className="bg-gray-50 rounded p-2 text-sm text-gray-800">
                          {text.originalText}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Translation
                        </label>
                        {onTextUpdate ? (
                          <textarea
                            value={text.translatedText || ''}
                            onChange={(e) => onTextUpdate(text.id, e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                          />
                        ) : (
                          <div className="bg-blue-50 rounded p-2 text-sm text-blue-800">
                            {text.translatedText || 'No translation'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Path: {text.path}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCodeView = () => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Code</h4>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
            {originalContent}
          </pre>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Translated Code</h4>
          <pre className="bg-blue-900 text-blue-100 p-4 rounded text-xs overflow-x-auto">
            {translatedContent}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('preview')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'preview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <EyeIcon className="h-4 w-4" />
          <span>Preview</span>
        </button>
        <button
          onClick={() => setViewMode('extracted')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'extracted'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DocumentTextIcon className="h-4 w-4" />
          <span>Extracted Texts ({extractedTexts.length})</span>
        </button>
        <button
          onClick={() => setViewMode('code')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'code'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CodeBracketIcon className="h-4 w-4" />
          <span>Code</span>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {viewMode === 'preview' && renderPreview()}
        {viewMode === 'extracted' && renderExtractedTexts()}
        {viewMode === 'code' && renderCodeView()}
      </div>
    </div>
  );
};