'use client';

import { ProcessedFileData } from '../utils/openGinProcessor';

interface DataPreviewProps {
  data: ProcessedFileData;
}

export default function DataPreview({ data }: DataPreviewProps) {
  const isCSV = data.fileName.toLowerCase().endsWith('.csv');
  const isJSON = data.fileName.toLowerCase().endsWith('.json');

  if (isCSV) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">CSV Data Preview (Table View)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
            <thead className="bg-gray-100 dark:bg-gray-600">
              <tr>
                {data.columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {data.data.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {data.columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-500"
                    >
                      {row[column] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.data.length > 10 && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              Showing first 10 rows of {data.data.length} total rows
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isJSON) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">JSON Data Preview</h3>
        <div className="max-h-96 overflow-auto">
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-white dark:bg-gray-800 p-4 rounded border">
            {JSON.stringify(data.data.slice(0, 5), null, 2)}
            {data.data.length > 5 && '\n... (showing first 5 objects)'}
          </pre>
        </div>
        {data.data.length > 5 && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
            Showing first 5 objects of {data.data.length} total objects
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 dark:text-white mb-4">Data Preview</h3>
      <div className="max-h-96 overflow-auto">
        <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {JSON.stringify(data.data.slice(0, 3), null, 2)}
          {data.data.length > 3 && '\n... (showing first 3 rows)'}
        </pre>
      </div>
    </div>
  );
}
