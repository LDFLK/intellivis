'use client';

export default function Home() {

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

        </div>
      </div>
    </div>
  );
}
