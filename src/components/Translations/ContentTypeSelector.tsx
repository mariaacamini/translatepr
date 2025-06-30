import React from 'react';
import { ContentType } from '../../types';
import { 
  CodeBracketIcon,
  DocumentTextIcon,
  PhotoIcon,
  CubeIcon,
  HashtagIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface ContentTypeSelectorProps {
  selectedType: ContentType;
  onTypeChange: (type: ContentType) => void;
  disabled?: boolean;
}

const contentTypeOptions = [
  {
    type: ContentType.PLAIN_TEXT,
    label: 'Plain Text',
    description: 'Simple text content',
    icon: DocumentTextIcon,
    color: 'text-gray-600'
  },
  {
    type: ContentType.HTML,
    label: 'HTML',
    description: 'HTML markup with tags',
    icon: CodeBracketIcon,
    color: 'text-orange-600'
  },
  {
    type: ContentType.MARKDOWN,
    label: 'Markdown',
    description: 'Markdown formatted text',
    icon: HashtagIcon,
    color: 'text-blue-600'
  },
  {
    type: ContentType.EDITOR_JS,
    label: 'Editor.js',
    description: 'Editor.js block content',
    icon: CubeIcon,
    color: 'text-purple-600'
  },
  {
    type: ContentType.GRAPE_JS,
    label: 'GrapeJS',
    description: 'GrapeJS page builder',
    icon: PhotoIcon,
    color: 'text-green-600'
  },
  {
    type: ContentType.JSON,
    label: 'JSON',
    description: 'Structured JSON data',
    icon: CodeBracketIcon,
    color: 'text-indigo-600'
  },
  {
    type: ContentType.RICH_TEXT,
    label: 'Rich Text',
    description: 'Rich text editor content',
    icon: DocumentTextIcon,
    color: 'text-pink-600'
  },
  {
    type: ContentType.STRUCTURED_DATA,
    label: 'Structured Data',
    description: 'Complex structured content',
    icon: GlobeAltIcon,
    color: 'text-teal-600'
  }
];

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Content Type
      </label>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {contentTypeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;
          
          return (
            <button
              key={option.type}
              type="button"
              disabled={disabled}
              onClick={() => onTypeChange(option.type)}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600' : option.color}`} />
                <div className="text-center">
                  <div className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {option.label}
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                    {option.description}
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};