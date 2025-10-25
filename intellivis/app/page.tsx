'use client';

import { useState } from 'react';
import FileUpload from './components/FileUpload';
import MetadataForm from './components/MetadataForm';
import DataPreview from './components/DataPreview';
import { OpenGinProcessor, ProcessedFileData, OpenGinTabularFormat, OpenGinMetadata } from './utils/openGinProcessor';

export default function Home() {
  const [processedData, setProcessedData] = useState<ProcessedFileData | null>(null);
  const [openGinData, setOpenGinData] = useState<OpenGinTabularFormat | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await OpenGinProcessor.processFile(file);
      setProcessedData(result);
      setDatasetName(file.name.split('.')[0]); // Use filename as default dataset name
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToOpenGin = () => {
    if (!processedData) return;
    setShowMetadataForm(true);
  };

  const handleMetadataSubmit = (metadata: OpenGinMetadata) => {
    if (!processedData) return;
    
    try {
      const openGinFormat = OpenGinProcessor.convertToOpenGinFormat(
        processedData,
        datasetName,
        metadata
      );
      setOpenGinData(openGinFormat);
      setShowMetadataForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert to OpenGIN format');
    }
  };

  const handleDownloadOpenGin = () => {
    if (!openGinData) return;
    OpenGinProcessor.downloadOpenGinFormat(openGinData);
  };

  const handleReset = () => {
    setProcessedData(null);
    setOpenGinData(null);
    setDatasetName('');
    setShowMetadataForm(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              OpenGIN Tabular Format Converter
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Convert CSV files or JSON files with columns/rows structure to OpenGIN format
            </p>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Supported formats:</strong> CSV files or JSON files with columns and rows structure
              </p>
            </div>
          </div>

          {/* Workflow Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Start Your Data Conversion Workflow
            </h2>
            <div className="text-center">
              <a
                href="/upload"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Start Data Upload Workflow
              </a>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Multi-step process: Upload → Metadata → Review → Download
              </p>
            </div>
          </div>

          {/* Quick Start Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Start (Legacy)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              For a quick single-page conversion, you can still use the original interface below.
              For the full workflow experience, use the "Start Data Upload Workflow" button above.
            </p>
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

          {processedData && !openGinData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Step 2: Review Your Data
                </h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Upload New File
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
                  <h3 className="font-medium text-gray-900 dark:text-white">Dataset Name</h3>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    placeholder="Enter dataset name"
                  />
                </div>
              </div>

              <div className="mb-6">
                <DataPreview data={processedData} />
              </div>

              <div className="text-center">
                <button
                  onClick={handleConvertToOpenGin}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                >
                  Convert to OpenGIN Tabular Format
                </button>
              </div>
            </div>
          )}

          {openGinData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  OpenGIN Tabular Format
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={handleDownloadOpenGin}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Download OpenGIN JSON
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  >
                    Start Over
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Dataset Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Name:</strong> {openGinData.datasetName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Data Source:</strong> {openGinData.metadata.dataSource}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Created:</strong> {openGinData.metadata.dateOfCreation}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Entry Person:</strong> {openGinData.metadata.dataEntryPerson}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Format Details</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Columns:</strong> {openGinData.columns.join(', ')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Total Rows:</strong> {openGinData.rows.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Description:</strong> {openGinData.metadata.description}
                  </p>
                </div>
              </div>

              {openGinData.metadata.importantUrls.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Important URLs</h3>
                  <div className="space-y-1">
                    {openGinData.metadata.importantUrls.map((url, index) => (
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

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">OpenGIN Format Preview</h3>
                <div className="max-h-96 overflow-auto">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(openGinData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <MetadataForm
        isVisible={showMetadataForm}
        onSubmit={handleMetadataSubmit}
        onCancel={() => setShowMetadataForm(false)}
      />
    </div>
  );
}
