'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '../components/FileUpload';
import DataPreview from '../components/DataPreview';
import { OpenGinProcessor, ProcessedFileData } from '../utils/openGinProcessor';

export default function UploadPage() {
  const router = useRouter();
  const [processedData, setProcessedData] = useState<ProcessedFileData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await OpenGinProcessor.processFile(file);
      setProcessedData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (processedData) {
      // Store the processed data in sessionStorage for the next page
      sessionStorage.setItem('processedData', JSON.stringify(processedData));
      router.push('/metadata');
    }
  };

  const handleReset = () => {
    setProcessedData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Step 1: Upload Your Data File
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Upload a CSV file or JSON file with columns/rows structure
            </p>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Supported formats:</strong> CSV files or JSON files with columns and rows structure
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <FileUpload onFileSelect={handleFileSelect} />
            
            {isProcessing && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-300">Processing file...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Data Preview */}
          {processedData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Data Preview
                </h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Upload Different File
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white">File Info</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Name: {processedData.fileName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Size: {(processedData.fileSize / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Rows: {processedData.rowCount}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white">Columns</h3>
                  <div className="flex flex-wrap gap-1">
                    {processedData.columns.slice(0, 5).map((col, index) => (
                      <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {col}
                      </span>
                    ))}
                    {processedData.columns.length > 5 && (
                      <span className="text-xs text-gray-500">+{processedData.columns.length - 5} more</span>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white">Next Step</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Click "Continue to Metadata" to proceed with adding dataset information
                  </p>
                </div>
              </div>

              <DataPreview data={processedData} />

              <div className="text-center mt-6">
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                >
                  Continue to Metadata →
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
