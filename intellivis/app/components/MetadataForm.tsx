'use client';

import { useState } from 'react';
import { OpenGinMetadata } from '../utils/openGinProcessor';

interface MetadataFormProps {
  onSubmit: (metadata: OpenGinMetadata) => void;
  onCancel: () => void;
  isVisible: boolean;
}

export default function MetadataForm({ onSubmit, onCancel, isVisible }: MetadataFormProps) {
  const [formData, setFormData] = useState<OpenGinMetadata>({
    dataSource: '',
    dateOfCreation: new Date().toISOString().split('T')[0], // Today's date
    dataEntryPerson: '',
    importantUrls: [''],
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof OpenGinMetadata, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.importantUrls];
    newUrls[index] = value;
    setFormData(prev => ({
      ...prev,
      importantUrls: newUrls
    }));
  };

  const addUrlField = () => {
    setFormData(prev => ({
      ...prev,
      importantUrls: [...prev.importantUrls, '']
    }));
  };

  const removeUrlField = (index: number) => {
    if (formData.importantUrls.length > 1) {
      const newUrls = formData.importantUrls.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        importantUrls: newUrls
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dataSource.trim()) {
      newErrors.dataSource = 'Data source is required';
    }

    if (!formData.dataEntryPerson.trim()) {
      newErrors.dataEntryPerson = 'Data entry person is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate URLs
    const validUrls = formData.importantUrls.filter(url => url.trim());
    if (validUrls.length > 0) {
      validUrls.forEach((url, index) => {
        try {
          new URL(url);
        } catch {
          newErrors[`url_${index}`] = 'Please enter a valid URL';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Filter out empty URLs
      const filteredUrls = formData.importantUrls.filter(url => url.trim());
      onSubmit({
        ...formData,
        importantUrls: filteredUrls
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dataset Metadata
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="dataSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Source *
              </label>
              <input
                type="text"
                id="dataSource"
                value={formData.dataSource}
                onChange={(e) => handleInputChange('dataSource', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.dataSource ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Company Database, Survey Results, API Endpoint"
              />
              {errors.dataSource && (
                <p className="mt-1 text-sm text-red-600">{errors.dataSource}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfCreation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Creation *
              </label>
              <input
                type="date"
                id="dateOfCreation"
                value={formData.dateOfCreation}
                onChange={(e) => handleInputChange('dateOfCreation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="dataEntryPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Entry Person *
              </label>
              <input
                type="text"
                id="dataEntryPerson"
                value={formData.dataEntryPerson}
                onChange={(e) => handleInputChange('dataEntryPerson', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.dataEntryPerson ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., John Doe, Data Team, System Admin"
              />
              {errors.dataEntryPerson && (
                <p className="mt-1 text-sm text-red-600">{errors.dataEntryPerson}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Important URLs
              </label>
              <div className="space-y-2">
                {formData.importantUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors[`url_${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://example.com"
                    />
                    {formData.importantUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlField(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addUrlField}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  + Add URL
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the dataset, its purpose, and any relevant information..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Continue to Conversion
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
