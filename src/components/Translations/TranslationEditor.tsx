import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Translation, TranslationStatus } from '../../types';
import { getLanguageFlag, getLanguageName } from '../../constants/languages';

interface TranslationEditorProps {
  translation: Translation;
  onUpdate: (id: string, updates: Partial<Translation>) => void;
  onCancel: () => void;
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  translation,
  onUpdate,
  onCancel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(translation.translatedText);
  const [isPreview, setIsPreview] = useState(false);

  const handleSave = () => {
    onUpdate(translation.id, {
      translatedText: editedText,
      status: TranslationStatus.COMPLETED,
      updatedAt: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(translation.translatedText);
    setIsEditing(false);
  };

  const getStatusColor = (status: TranslationStatus) => {
    switch (status) {
      case TranslationStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TranslationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TranslationStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case TranslationStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getLanguageFlag(translation.sourceLanguage)}</span>
              <span className="text-gray-400">→</span>
              <span className="text-2xl">{getLanguageFlag(translation.targetLanguage)}</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {getLanguageName(translation.sourceLanguage)} → {getLanguageName(translation.targetLanguage)}
              </h3>
              <p className="text-sm text-gray-500">{translation.context}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(translation.status)}`}>
              {translation.status}
            </span>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Text
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 min-h-[120px]">
              <p className="text-gray-900 leading-relaxed">{translation.sourceText}</p>
            </div>
          </div>

          {/* Translated Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Translation
              </label>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full border border-gray-200 rounded-md p-4 min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter translation..."
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md p-4 min-h-[120px] bg-white">
                {translation.translatedText ? (
                  <p className="text-gray-900 leading-relaxed">{translation.translatedText}</p>
                ) : (
                  <p className="text-gray-400 italic">No translation available</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Mode */}
        {isPreview && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
            <div className="bg-white border border-blue-200 rounded-md p-4">
              <p className="text-gray-900 leading-relaxed">
                {translation.translatedText || 'No translation available'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Provider: <span className="font-medium">{translation.provider}</span>
            {translation.updatedAt && (
              <span className="ml-4">
                Updated: {new Date(translation.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};