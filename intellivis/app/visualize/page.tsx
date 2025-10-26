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
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [showDataTable, setShowDataTable] = useState(false);

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

  const downloadDataAsCSV = () => {
    if (!parsedData) return;
    
    const { columns, rows } = parsedData.data;
    
    // Create CSV content
    const csvContent = [
      columns.join(','), // Header row
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')) // Data rows
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataSummary?.datasetName || 'data'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    
    setIsTestingApiKey(true);
    setApiKeyStatus('testing');
    setError(null);
    
    try {
      const isValid = await DeepSeekAPI.testApiKey(apiKey.trim());
      if (isValid) {
        setApiKeyStatus('valid');
        setError(null);
      } else {
        setApiKeyStatus('invalid');
        setError('API key test failed. Please check your key and try again.');
      }
    } catch (err) {
      setApiKeyStatus('invalid');
      setError(err instanceof Error ? err.message : 'Failed to test API key');
    } finally {
      setIsTestingApiKey(false);
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
          {apiKeyStatus !== 'valid' && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {apiKeyStatus === 'testing' ? 'Testing API Key...' : 
                   apiKeyStatus === 'invalid' ? 'API Key Invalid' :
                   'DeepSeek API Key Required'}
                </h2>
                <p className="text-gray-300 mb-6">
                  {apiKeyStatus === 'testing' ? 'Please wait while we test your API key...' :
                   apiKeyStatus === 'invalid' ? 'Your API key failed validation. Please check and try again.' :
                   'Enter your DeepSeek API key to enable AI-powered visualization suggestions'}
                </p>
              </div>
              
              <form onSubmit={handleApiKeySubmit} className="max-w-md mx-auto">
                <div className="mb-4">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your DeepSeek API key"
                    className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      apiKeyStatus === 'invalid' 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:ring-purple-500'
                    }`}
                    disabled={isTestingApiKey}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTestingApiKey || !apiKey.trim()}
                  className={`w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-300 ${
                    isTestingApiKey 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {isTestingApiKey ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Testing API Key...
                    </div>
                  ) : (
                    'Test & Save API Key'
                  )}
                </button>
              </form>
              
              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg max-w-md mx-auto">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          {apiKeyStatus === 'valid' && !parsedData && (
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Dataset Summary</h2>
                <button
                  onClick={() => setShowDataTable(!showDataTable)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{showDataTable ? 'Hide Data Table' : 'View Data Table'}</span>
                </button>
              </div>
              
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
              
              {/* Data Table */}
              {showDataTable && parsedData && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">Data Preview</h3>
                    <button
                      onClick={downloadDataAsCSV}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download CSV</span>
                    </button>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-auto">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-gray-300">
                        <thead className="sticky top-0 bg-gray-800">
                          <tr className="border-b border-gray-600">
                            {parsedData.data.columns.map((col: string, index: number) => (
                              <th key={index} className="text-left py-2 px-3 font-medium whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.data.rows.slice(0, 100).map((row: any[], rowIndex: number) => (
                            <tr key={rowIndex} className="border-b border-gray-700 hover:bg-gray-800/50">
                              {row.map((cell: any, cellIndex: number) => (
                                <td key={cellIndex} className="py-2 px-3 whitespace-nowrap">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedData.data.rows.length > 100 && (
                      <div className="mt-4 text-center text-gray-400 text-sm">
                        Showing first 100 rows of {parsedData.data.rows.length.toLocaleString()} total rows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visualization Interface */}
          {apiKeyStatus === 'valid' && parsedData && dataSummary && (
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
