'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataPreview from '../components/DataPreview';
import { OpenGinProcessor, ProcessedFileData, OpenGinMetadata, OpenGinTabularFormat } from '../utils/openGinProcessor';

export default function ReviewPage() {
  const router = useRouter();
  const [processedData, setProcessedData] = useState<ProcessedFileData | null>(null);
  const [metadata, setMetadata] = useState<OpenGinMetadata | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [openGinData, setOpenGinData] = useState<OpenGinTabularFormat | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data from sessionStorage
    const storedData = sessionStorage.getItem('processedData');
    const storedMetadata = sessionStorage.getItem('metadata');
    
    if (!storedData || !storedMetadata) {
      router.push('/upload');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      const meta = JSON.parse(storedMetadata);
      setProcessedData(data);
      setMetadata(meta);
      setDatasetName(data.fileName.split('.')[0]); // Use filename as default
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing stored data:', error);
      router.push('/upload');
    }
  }, [router]);

  const handleGenerate = async () => {
    if (!processedData || !metadata) return;
    
    setIsGenerating(true);
    
    try {
      const openGinFormat = OpenGinProcessor.convertToOpenGinFormat(
        processedData,
        datasetName,
        metadata
      );
      setOpenGinData(openGinFormat);
      
      // Store the generated data for the download page
      sessionStorage.setItem('openGinData', JSON.stringify(openGinFormat));
      sessionStorage.setItem('datasetName', datasetName);
      
      // Navigate to download page
      router.push('/download');
    } catch (error) {
      console.error('Error generating OpenGIN format:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    router.push('/metadata');
  };

  const handleEditMetadata = () => {
    // Ensure current metadata is saved before navigating back
    if (metadata) {
      sessionStorage.setItem('metadata', JSON.stringify(metadata));
    }
    router.push('/metadata');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!processedData || !metadata) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Data Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Please start over with the upload process.</p>
          <button
            onClick={() => router.push('/upload')}
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
              Step 3: Review and Generate
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Review your data and metadata, then generate OpenGIN format files
            </p>
          </div>

          {/* Dataset Name */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Dataset Name
            </h2>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter dataset name"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This will be used as the folder name in the downloaded zip file
            </p>
          </div>

          {/* Data Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Data Preview
            </h2>
            <DataPreview data={processedData} />
          </div>

          {/* Metadata Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Metadata Preview
              </h2>
              <button
                onClick={handleEditMetadata}
                className="px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                Edit Metadata
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Data Source</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{metadata.dataSource}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Date of Creation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{metadata.dateOfCreation}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Data Entry Person</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{metadata.dataEntryPerson}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Description</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{metadata.description}</p>
                </div>
                {metadata.importantUrls.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Important URLs</h3>
                    <div className="space-y-1">
                      {metadata.importantUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm block"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generation Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generated Files Preview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">data.json</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Contains the OpenGIN tabular format with columns and rows
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <p>Columns: {processedData.columns.length}</p>
                  <p>Rows: {processedData.rowCount}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">metadata.json</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Contains dataset metadata and information
                </p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <p>Source: {metadata.dataSource}</p>
                  <p>Created: {metadata.dateOfCreation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              ← Back to Metadata
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !datasetName.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                'Generate OpenGIN Files →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
