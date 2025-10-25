'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OpenGinMetadata } from '../utils/openGinProcessor';

export default function MetadataPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<OpenGinMetadata>({
    dataSource: '',
    dateOfCreation: new Date().toISOString().split('T')[0],
    dataEntryPerson: '',
    importantUrls: [''],
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if we have processed data from the previous step
    const processedData = sessionStorage.getItem('processedData');
    if (!processedData) {
      router.push('/upload');
      return;
    }

    // Load existing metadata if available (when coming back from review page)
    const storedMetadata = sessionStorage.getItem('metadata');
    if (storedMetadata) {
      try {
        const metadata = JSON.parse(storedMetadata);
        setFormData(metadata);
        setIsEditing(true); // Indicate that we're editing existing metadata
      } catch (error) {
        console.error('Error parsing stored metadata:', error);
      }
    }

    setIsLoading(false);
  }, [router]);

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
      const metadata = {
        ...formData,
        importantUrls: filteredUrls
      };
      
      // Store metadata in sessionStorage
      sessionStorage.setItem('metadata', JSON.stringify(metadata));
      router.push('/review');
    }
  };

  const handleBack = () => {
    router.push('/upload');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {isEditing ? 'Edit Dataset Metadata' : 'Step 2: Add Dataset Metadata'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {isEditing ? 'Update your dataset information' : 'Provide information about your dataset'}
            </p>
            {isEditing && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-2xl mx-auto">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Editing existing metadata:</strong> Your previous entries have been loaded. Make any changes and continue.
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  ← Back to Upload
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isEditing ? 'Update and Continue to Review →' : 'Continue to Review →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
