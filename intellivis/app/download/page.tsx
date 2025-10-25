'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OpenGinTabularFormat, OpenGinMetadata, Category } from '../utils/openGinProcessor';
import { ZipGenerator, ZipFile } from '../utils/zipGenerator';

export default function DownloadPage() {
  const router = useRouter();
  const [openGinData, setOpenGinData] = useState<OpenGinTabularFormat | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [sanitizedFolderName, setSanitizedFolderName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<{
    dataJson: boolean;
    metadataJson: boolean;
  }>({
    dataJson: false,
    metadataJson: false
  });

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('openGinData');
    const storedName = sessionStorage.getItem('datasetName');
    
    if (!storedData || !storedName) {
      router.push('/upload');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setOpenGinData(data);
      setDatasetName(storedName);
      setSanitizedFolderName(ZipGenerator.sanitizeFolderName(storedName));
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing stored data:', error);
      router.push('/upload');
    }
  }, [router]);

  const handleDownload = async () => {
    if (!openGinData) return;
    
    setIsGenerating(true);
    
    try {
      // Prepare the data.json file
      const dataJson = {
        columns: openGinData.columns,
        rows: openGinData.rows
      };

      // Prepare the metadata.json file
      const metadataJson = {
        datasetName: openGinData.datasetName,
        metadata: openGinData.metadata
      };

      // Create files for zip
      const files: ZipFile[] = [
        {
          name: 'data.json',
          content: JSON.stringify(dataJson, null, 2)
        },
        {
          name: 'metadata.json',
          content: JSON.stringify(metadataJson, null, 2)
        }
      ];

      // Generate zip file
      const zipBlob = await ZipGenerator.createZip(files, sanitizedFolderName);
      
      // Download the zip file
      ZipGenerator.downloadZip(zipBlob, `${sanitizedFolderName}.zip`);
      
    } catch (error) {
      console.error('Error generating zip file:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    // Clear session storage
    sessionStorage.removeItem('processedData');
    sessionStorage.removeItem('metadata');
    sessionStorage.removeItem('openGinData');
    sessionStorage.removeItem('datasetName');
    router.push('/upload');
  };

  const toggleFileContent = (fileType: 'dataJson' | 'metadataJson') => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileType]: !prev[fileType]
    }));
  };

  const getDataJsonContent = () => {
    if (!openGinData) return '';
    return JSON.stringify({
      columns: openGinData.columns,
      rows: openGinData.rows
    }, null, 2);
  };

  const getMetadataJsonContent = () => {
    if (!openGinData) return '';
    return JSON.stringify({
      datasetName: openGinData.datasetName,
      metadata: openGinData.metadata
    }, null, 2);
  };

  const copyToClipboard = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
      console.log(`${fileName} content copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const renderCategories = (categories: Category[]): string => {
    const formatCategory = (category: Category, level: number = 0): string => {
      const indent = '  '.repeat(level);
      let result = `${indent}• ${category.name}`;
      
      if (category.subcategories && category.subcategories.length > 0) {
        result += '\n' + category.subcategories.map(sub => formatCategory(sub, level + 1)).join('\n');
      }
      
      return result;
    };
    
    return categories.map(category => formatCategory(category)).join('\n');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!openGinData) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Data Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Please start over with the upload process.</p>
          <button
            onClick={handleStartOver}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Step 4: Download Your Files
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your OpenGIN format files are ready for download
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Files Generated Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>Your OpenGIN format files have been generated and are ready for download.</p>
                </div>
              </div>
            </div>
          </div>

          {/* File Structure Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generated File Structure
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
                <div className="flex items-center mb-2">
                  <span className="text-blue-600">📁</span>
                  <span className="ml-2 font-semibold">{sanitizedFolderName}/</span>
                </div>
                <div className="ml-4 space-y-1">
                  <div className="flex items-center">
                    <span className="text-green-600">📄</span>
                    <span className="ml-2">data.json</span>
                    <span className="ml-2 text-gray-500">({openGinData.rows.length} rows)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600">📄</span>
                    <span className="ml-2">metadata.json</span>
                    <span className="ml-2 text-gray-500">(dataset info)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* File Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div 
                className="cursor-pointer"
                onClick={() => toggleFileContent('dataJson')}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">data.json</h3>
                  <div className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <span className="text-sm mr-2">
                      {expandedFiles.dataJson ? 'Hide Content' : 'Show Content'}
                    </span>
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${expandedFiles.dataJson ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Columns:</span>
                    <span className="font-medium">{openGinData.columns.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Rows:</span>
                    <span className="font-medium">{openGinData.rows.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Format:</span>
                    <span className="font-medium">OpenGIN Tabular</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Columns:</h4>
                  <div className="flex flex-wrap gap-1">
                    {openGinData.columns.slice(0, 3).map((col, index) => (
                      <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {col}
                      </span>
                    ))}
                    {openGinData.columns.length > 3 && (
                      <span className="text-xs text-gray-500">+{openGinData.columns.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Content */}
              {expandedFiles.dataJson && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">File Content:</h4>
                    <button
                      onClick={() => copyToClipboard(getDataJsonContent(), 'data.json')}
                      className="flex items-center px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-md transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-auto">
                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {getDataJsonContent()}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div 
                className="cursor-pointer"
                onClick={() => toggleFileContent('metadataJson')}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">metadata.json</h3>
                  <div className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <span className="text-sm mr-2">
                      {expandedFiles.metadataJson ? 'Hide Content' : 'Show Content'}
                    </span>
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${expandedFiles.metadataJson ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Dataset:</span>
                    <span className="font-medium">{openGinData.datasetName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Source:</span>
                    <span className="font-medium text-sm">{openGinData.metadata.dataSource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Created:</span>
                    <span className="font-medium">{openGinData.metadata.dateOfCreation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Entry Person:</span>
                    <span className="font-medium text-sm">{openGinData.metadata.dataEntryPerson}</span>
                  </div>
                  {openGinData.metadata.categories && openGinData.metadata.categories.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Categories:</span>
                      <div className="text-right">
                        <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {renderCategories(openGinData.metadata.categories)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable Content */}
              {expandedFiles.metadataJson && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">File Content:</h4>
                    <button
                      onClick={() => copyToClipboard(getMetadataJsonContent(), 'metadata.json')}
                      className="flex items-center px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-md transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-auto">
                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {getMetadataJsonContent()}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Download Files
            </h2>
            <div className="text-center">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating ZIP...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download {sanitizedFolderName}.zip
                  </div>
                )}
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Downloads a ZIP file containing data.json and metadata.json
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleStartOver}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Start New Dataset
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
