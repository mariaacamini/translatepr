import React, { useState } from 'react';
import { ContentType } from '../../types';
import { enhancedTranslationService } from '../../services/enhancedTranslationService';
import { ContentTypeSelector } from './ContentTypeSelector';
import { 
  PlayIcon, 
  StopIcon, 
  DocumentPlusIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface ContentItem {
  id: string;
  content: string;
  context: string;
  contentType?: ContentType;
}

interface BulkContentProcessorProps {
  onProcessingComplete: (results: any[]) => void;
}

export const BulkContentProcessor: React.FC<BulkContentProcessorProps> = ({
  onProcessingComplete
}) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['es']);
  const [defaultContentType, setDefaultContentType] = useState<ContentType>(ContentType.PLAIN_TEXT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const addContentItem = () => {
    const newItem: ContentItem = {
      id: `item_${Date.now()}`,
      content: '',
      context: '',
      contentType: defaultContentType
    };
    setContentItems([...contentItems, newItem]);
  };

  const updateContentItem = (id: string, updates: Partial<ContentItem>) => {
    setContentItems(items =>
      items.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const removeContentItem = (id: string) => {
    setContentItems(items => items.filter(item => item.id !== id));
  };

  const handleBulkProcess = async () => {
    if (contentItems.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const validItems = contentItems.filter(item => 
        item.content.trim() && item.context.trim()
      );

      const results = await enhancedTranslationService.bulkProcessContent(
        validItems,
        sourceLanguage,
        targetLanguages
      );

      setProgress(100);
      onProcessingComplete(results);
    } catch (error) {
      console.error('Bulk processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedItems: ContentItem[] = [];

        if (file.type === 'application/json') {
          const jsonData = JSON.parse(content);
          if (Array.isArray(jsonData)) {
            importedItems = jsonData.map((item, index) => ({
              id: `imported_${Date.now()}_${index}`,
              content: typeof item === 'string' ? item : JSON.stringify(item),
              context: `Imported item ${index + 1}`,
              contentType: typeof item === 'string' ? ContentType.PLAIN_TEXT : ContentType.JSON
            }));
          }
        } else {
          // Text file - split by lines
          const lines = content.split('\n').filter(line => line.trim());
          importedItems = lines.map((line, index) => ({
            id: `imported_${Date.now()}_${index}`,
            content: line.trim(),
            context: `Line ${index + 1}`,
            contentType: defaultContentType
          }));
        }

        setContentItems([...contentItems, ...importedItems]);
      } catch (error) {
        console.error('Failed to import file:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Bulk Content Processor</h3>
            <p className="text-sm text-gray-500 mt-1">
              Process multiple content items with structure-aware translation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer">
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".json,.txt,.csv"
                onChange={handleImportFromFile}
                className="hidden"
              />
            </label>
            <button
              onClick={addContentItem}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
            >
              <DocumentPlusIcon className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Language
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Languages
            </label>
            <select
              multiple
              value={targetLanguages}
              onChange={(e) => setTargetLanguages(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={3}
            >
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>

          <div>
            <ContentTypeSelector
              selectedType={defaultContentType}
              onTypeChange={setDefaultContentType}
            />
          </div>
        </div>

        {/* Content Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              Content Items ({contentItems.length})
            </h4>
            {contentItems.length > 0 && (
              <button
                onClick={() => setContentItems([])}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {contentItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No content items</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add content items to start bulk processing
              </p>
              <button
                onClick={addContentItem}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add First Item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {contentItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                    <button
                      onClick={() => removeContentItem(item.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <textarea
                        value={item.content}
                        onChange={(e) => updateContentItem(item.id, { content: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Enter content to translate..."
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Context
                        </label>
                        <input
                          type="text"
                          value={item.context}
                          onChange={(e) => updateContentItem(item.id, { context: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., product:123"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={item.contentType || defaultContentType}
                          onChange={(e) => updateContentItem(item.id, { contentType: e.target.value as ContentType })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Object.values(ContentType).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processing Controls */}
        {contentItems.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {contentItems.filter(item => item.content.trim() && item.context.trim()).length} items ready for processing
            </div>
            
            {isProcessing && (
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
            )}
            
            <button
              onClick={handleBulkProcess}
              disabled={isProcessing || contentItems.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <StopIcon className="h-4 w-4" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  <span>Start Processing</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};