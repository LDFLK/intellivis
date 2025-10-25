'use client';

import { useState } from 'react';
import ZipFileUpload from '../components/ZipFileUpload';
import VisualizationChatbot from '../components/VisualizationChatbot';
import DataVisualization from '../components/DataVisualization';
import ZipDebugger from '../components/ZipDebugger';
import { ZipParser, ParsedOpenGinData } from '../utils/zipParser';
import { DeepSeekAPI, VisualizationSuggestion } from '../utils/deepseekApi';

export default function VisualizePage() {
  const [parsedData, setParsedData] = useState<ParsedOpenGinData | null>(null);
  const [dataSummary, setDataSummary] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [currentVisualization, setCurrentVisualization] = useState<VisualizationSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Processing file:', file.name, 'Size:', file.size);
      const parsed = await ZipParser.parseOpenGinZip(file);
      console.log('Parsed data:', parsed);
      
      if (!ZipParser.validateOpenGinData(parsed)) {
        throw new Error('Invalid OpenGIN data structure');
      }
      
      const summary = ZipParser.getDataSummary(parsed);
      console.log('Data summary:', summary);
      setParsedData(parsed);
      setDataSummary(summary);
    } catch (err) {
      console.error('Error parsing ZIP:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse ZIP file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualizationRequest = (suggestion: VisualizationSuggestion) => {
    setCurrentVisualization(suggestion);
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      // API key is set, ready to use
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">OpenGIN</span>
            <span className="text-2xl font-light text-gray-300">Intellivis</span>
          </div>
          <a
            href="/"
            className="text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Data Visualization
            </h1>
            <p className="text-lg text-gray-300">
              Upload your OpenGIN ZIP file and create intelligent visualizations with AI assistance
            </p>
          </div>

          {/* API Key Setup */}
          {!apiKey && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  DeepSeek API Key Required
                </h2>
                <p className="text-gray-300 mb-6">
                  Enter your DeepSeek API key to enable AI-powered visualization suggestions
                </p>
              </div>
              
              <form onSubmit={handleApiKeySubmit} className="max-w-md mx-auto">
                <div className="mb-4">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your DeepSeek API key"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  Save API Key
                </button>
              </form>
            </div>
          )}

          {/* File Upload */}
          {apiKey && !parsedData && (
            <div className="space-y-8">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    Upload Your OpenGIN ZIP File
                  </h2>
                  <p className="text-gray-300">
                    Upload the ZIP file you downloaded from the data processing workflow
                  </p>
                </div>
                
                <ZipFileUpload
                  onFileSelect={handleFileSelect}
                  onError={setError}
                  className="max-w-2xl mx-auto"
                />
                
                {error && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg max-w-2xl mx-auto">
                    <p className="text-red-300">{error}</p>
                  </div>
                )}
              </div>
              
              {/* Debug Section */}
              <ZipDebugger onFileSelect={handleFileSelect} />
            </div>
          )}

          {/* Data Summary */}
          {dataSummary && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6">Dataset Summary</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Dataset Information</h3>
                  <div className="space-y-2 text-gray-300">
                    <p><strong>Name:</strong> {dataSummary.datasetName}</p>
                    <p><strong>Rows:</strong> {dataSummary.totalRows.toLocaleString()}</p>
                    <p><strong>Columns:</strong> {dataSummary.totalColumns}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Columns</h3>
                  <div className="flex flex-wrap gap-2">
                    {dataSummary.columns.map((col: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visualization Interface */}
          {parsedData && dataSummary && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Chatbot */}
              <div>
                <VisualizationChatbot
                  dataSummary={dataSummary}
                  apiKey={apiKey}
                  onVisualizationRequest={handleVisualizationRequest}
                />
              </div>

              {/* Visualization */}
              <div>
                {currentVisualization ? (
                  <DataVisualization
                    suggestion={currentVisualization}
                    data={parsedData.data}
                  />
                ) : (
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Ready for Visualization</h3>
                      <p className="text-gray-400">Ask the AI assistant to create a visualization for your data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">
            © 2024 OpenGIN Intellivis. Advanced data processing and visualization platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
