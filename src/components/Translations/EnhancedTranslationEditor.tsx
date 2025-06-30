import React, { useState, useEffect } from 'react';
import { Translation, ContentType, ExtractedText } from '../../types';
import { ContentTypeSelector } from './ContentTypeSelector';
import { StructuredContentPreview } from './StructuredContentPreview';
import { enhancedTranslationService } from '../../services/enhancedTranslationService';
import { ContentParserFactory } from '../../services/contentParsers';
import { 
  CheckIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface EnhancedTranslationEditorProps {
  translation: Translation;
  onUpdate: (id: string, updates: Partial<Translation>) => void;
  onCancel: () => void;
}

export const EnhancedTranslationEditor: React.FC<EnhancedTranslationEditorProps> = ({
  translation,
  onUpdate,
  onCancel
}) => {
  const [contentType, setContentType] = useState<ContentType>(
    translation.contentType || ContentType.PLAIN_TEXT
  );
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } | null>(null);
  const [optimizations, setOptimizations] = useState<string[]>([]);

  useEffect(() => {
    if (translation.metadata?.extractedTexts) {
      setExtractedTexts(translation.metadata.extractedTexts);
    } else {
      extractTextsFromContent();
    }
  }, [translation.sourceText, contentType]);

  const extractTextsFromContent = async () => {
    const parser = ContentParserFactory.getParserByType(contentType);
    if (parser) {
      const texts = parser.parse(translation.sourceText);
      setExtractedTexts(texts);
    }
  };

  const handleReprocess = async () => {
    setIsProcessing(true);
    try {
      const processedTranslation = await enhancedTranslationService.processStructuredContent(
        translation.sourceText,
        translation.sourceLanguage,
        translation.targetLanguage,
        translation.context,
        contentType
      );

      onUpdate(translation.id, {
        translatedText: processedTranslation.translatedText,
        contentType: processedTranslation.contentType,
        metadata: processedTranslation.metadata
      });

      if (processedTranslation.metadata?.extractedTexts) {
        setExtractedTexts(processedTranslation.metadata.extractedTexts);
      }
    } catch (error) {
      console.error('Failed to reprocess translation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidate = async () => {
    const result = await enhancedTranslationService.validateTranslation(translation);
    setValidationResult(result);
  };

  const handleOptimize = async () => {
    const result = await enhancedTranslationService.optimizeForContentType(
      translation.sourceText,
      contentType,
      translation.targetLanguage
    );
    
    setOptimizations(result.optimizations);
    
    if (result.optimizedContent !== translation.sourceText) {
      onUpdate(translation.id, {
        sourceText: result.optimizedContent
      });
    }
  };

  const handleTextUpdate = (textId: string, newTranslation: string) => {
    const updatedTexts = extractedTexts.map(text =>
      text.id === textId ? { ...text, translatedText: newTranslation } : text
    );
    setExtractedTexts(updatedTexts);

    // Reconstruct the full content with updated translations
    const parser = ContentParserFactory.getParserByType(contentType);
    if (parser) {
      const reconstructedContent = parser.reconstruct(translation.sourceText, updatedTexts);
      onUpdate(translation.id, {
        translatedText: reconstructedContent,
        metadata: {
          ...translation.metadata,
          extractedTexts: updatedTexts
        }
      });
    }
  };

  const handleSave = () => {
    onUpdate(translation.id, {
      contentType,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Enhanced Translation Editor</h3>
            <p className="text-sm text-gray-500 mt-1">
              Advanced content-aware translation with structure preservation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleValidate}
              className="px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
            >
              Validate
            </button>
            <button
              onClick={handleOptimize}
              className="px-3 py-2 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors"
            >
              Optimize
            </button>
            <button
              onClick={handleReprocess}
              disabled={isProcessing}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowPathIcon className="h-4 w-4" />
              )}
              <span>Reprocess</span>
            </button>
          </div>
        </div>

        {/* Content Type Selector */}
        <ContentTypeSelector
          selectedType={contentType}
          onTypeChange={setContentType}
          disabled={isProcessing}
        />

        {/* Validation Results */}
        {validationResult && (
          <div className={`p-4 rounded-lg ${
            validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {validationResult.isValid ? (
                <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  validationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.isValid ? 'Translation Valid' : 'Validation Issues Found'}
                </h4>
                {validationResult.issues.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {validationResult.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                )}
                {validationResult.suggestions.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700">Suggestions:</h5>
                    <ul className="mt-1 text-sm text-gray-600 space-y-1">
                      {validationResult.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Optimizations */}
        {optimizations.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Optimizations Applied</h4>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  {optimizations.map((optimization, index) => (
                    <li key={index}>• {optimization}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content Preview */}
        <StructuredContentPreview
          originalContent={translation.sourceText}
          translatedContent={translation.translatedText}
          extractedTexts={extractedTexts}
          contentType={contentType}
          onTextUpdate={handleTextUpdate}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {extractedTexts.length} translatable elements found
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              <span>Save Translation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};