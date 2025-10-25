'use client';

import { useState, useEffect } from 'react';
import { VisualizationSuggestion } from '../utils/deepseekApi';

interface DataVisualizationProps {
  suggestion: VisualizationSuggestion;
  data: {
    columns: string[];
    rows: any[][];
  };
}

export default function DataVisualization({ suggestion, data }: DataVisualizationProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    processData();
  }, [suggestion, data]);

  const processData = () => {
    setIsLoading(true);
    
    try {
      const { columns, rows } = data;
      const { chartType, columns: selectedColumns } = suggestion;
      
      if (!selectedColumns || selectedColumns.length === 0) {
        throw new Error('No columns specified for visualization');
      }
      
      // Find column indices
      const columnIndices = selectedColumns.map(col => columns.indexOf(col));
      const validIndices = columnIndices.filter(idx => idx !== -1);
      
      if (validIndices.length === 0) {
        throw new Error('Specified columns not found in data');
      }
      
      let processedData;
      
      switch (chartType) {
        case 'bar':
          processedData = createBarChartData(rows, validIndices, columns);
          break;
        case 'line':
          processedData = createLineChartData(rows, validIndices, columns);
          break;
        case 'pie':
          processedData = createPieChartData(rows, validIndices, columns);
          break;
        case 'scatter':
          processedData = createScatterChartData(rows, validIndices, columns);
          break;
        case 'histogram':
          processedData = createHistogramData(rows, validIndices[0], columns);
          break;
        default:
          processedData = createTableData(rows, validIndices, columns);
      }
      
      setChartData(processedData);
    } catch (error) {
      console.error('Error processing data:', error);
      setChartData({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const createBarChartData = (rows: any[][], indices: number[], columns: string[]) => {
    const valueCounts: { [key: string]: number } = {};
    
    rows.forEach(row => {
      const key = indices.map(idx => row[idx]).join(' - ');
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    });
    
    return {
      type: 'bar',
      labels: Object.keys(valueCounts),
      datasets: [{
        label: 'Count',
        data: Object.values(valueCounts),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };

  const createLineChartData = (rows: any[][], indices: number[], columns: string[]) => {
    const sortedRows = [...rows].sort((a, b) => {
      const aVal = parseFloat(a[indices[0]]) || 0;
      const bVal = parseFloat(b[indices[0]]) || 0;
      return aVal - bVal;
    });
    
    return {
      type: 'line',
      labels: sortedRows.map(row => row[indices[0]]),
      datasets: indices.slice(1).map((idx, i) => ({
        label: columns[idx],
        data: sortedRows.map(row => parseFloat(row[idx]) || 0),
        borderColor: `hsl(${i * 60}, 70%, 50%)`,
        backgroundColor: `hsla(${i * 60}, 70%, 50%, 0.1)`,
        tension: 0.1
      }))
    };
  };

  const createPieChartData = (rows: any[][], indices: number[], columns: string[]) => {
    const valueCounts: { [key: string]: number } = {};
    
    rows.forEach(row => {
      const key = row[indices[0]];
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    });
    
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];
    
    return {
      type: 'pie',
      labels: Object.keys(valueCounts),
      datasets: [{
        data: Object.values(valueCounts),
        backgroundColor: colors.slice(0, Object.keys(valueCounts).length),
        borderWidth: 1
      }]
    };
  };

  const createScatterChartData = (rows: any[][], indices: number[], columns: string[]) => {
    return {
      type: 'scatter',
      datasets: [{
        label: `${columns[indices[0]]} vs ${columns[indices[1]]}`,
        data: rows.map(row => ({
          x: parseFloat(row[indices[0]]) || 0,
          y: parseFloat(row[indices[1]]) || 0
        })),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)'
      }]
    };
  };

  const createHistogramData = (rows: any[][], index: number, columns: string[]) => {
    const values = rows.map(row => parseFloat(row[index]) || 0).filter(v => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bins = 10;
    const binSize = (max - min) / bins;
    
    const histogram: { [key: string]: number } = {};
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      histogram[`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`] = 0;
    }
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      const binStart = min + binIndex * binSize;
      const binEnd = min + (binIndex + 1) * binSize;
      const binKey = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
      histogram[binKey]++;
    });
    
    return {
      type: 'bar',
      labels: Object.keys(histogram),
      datasets: [{
        label: columns[index],
        data: Object.values(histogram),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }]
    };
  };

  const createTableData = (rows: any[][], indices: number[], columns: string[]) => {
    return {
      type: 'table',
      columns: indices.map(idx => columns[idx]),
      data: rows.slice(0, 100) // Limit to first 100 rows
    };
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-300">Generating visualization...</span>
        </div>
      </div>
    );
  }

  if (chartData?.error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-red-500/50 rounded-2xl p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">Visualization Error</h3>
          <p className="text-gray-300">{chartData.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-2">{suggestion.title}</h3>
        <p className="text-gray-300 text-sm">{suggestion.description}</p>
      </div>
      
      {chartData?.type === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="border-b border-gray-600">
                {chartData.columns.map((col: string, index: number) => (
                  <th key={index} className="text-left py-2 px-3 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.data.map((row: any[], rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-gray-700">
                  {chartData.columns.map((col: string, colIndex: number) => (
                    <td key={colIndex} className="py-2 px-3">
                      {row[chartData.columns.indexOf(col)]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center bg-gray-900/50 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400">
              {suggestion.chartType?.toUpperCase()} Chart
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Chart visualization would be rendered here
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <p className="text-sm text-gray-300">
          <strong>Reasoning:</strong> {suggestion.reasoning}
        </p>
      </div>
    </div>
  );
}
