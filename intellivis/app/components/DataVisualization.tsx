'use client';

import { useState, useEffect } from 'react';
import { VisualizationSuggestion } from '../utils/deepseekApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import { useRef } from 'react';
import { pdfGenerator, PDFReportData } from '../utils/pdfGenerator';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DataVisualizationProps {
  suggestion: VisualizationSuggestion;
  data: {
    columns: string[];
    rows: any[][];
  };
  onExportReport?: () => void;
  dataSummary?: {
    datasetName: string;
    totalRows: number;
    totalColumns: number;
    columns: string[];
    sampleData: any[][];
  };
  metadata?: any;
}

export default function DataVisualization({ suggestion, data, onExportReport, dataSummary, metadata }: DataVisualizationProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAxes, setSelectedAxes] = useState<{x: string, y: string} | null>(null);
  const [showAxisControls, setShowAxisControls] = useState(false);
  const [currentChartType, setCurrentChartType] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    processData();
  }, [suggestion, data]);

  // Note: We don't auto-update on selectedAxes change to prevent infinite loops
  // The Update button explicitly calls updateChartWithAxes()

  const autoDetectAxes = (columns: string[]) => {
    // Try to detect numeric columns for Y axis and categorical for X axis
    const numericColumns = columns.filter(col => {
      const sampleValues = data.rows.slice(0, 10).map(row => row[columns.indexOf(col)]);
      return sampleValues.some(val => !isNaN(parseFloat(val)) && isFinite(parseFloat(val)));
    });
    
    const categoricalColumns = columns.filter(col => {
      const sampleValues = data.rows.slice(0, 10).map(row => row[columns.indexOf(col)]);
      return sampleValues.some(val => isNaN(parseFloat(val)) || !isFinite(parseFloat(val)));
    });

    return {
      x: categoricalColumns[0] || columns[0],
      y: numericColumns[0] || columns[1] || columns[0]
    };
  };

  const processData = () => {
    setIsLoading(true);
    
    try {
      const { columns, rows } = data;
      const { chartType, columns: selectedColumns } = suggestion;
      
      if (!selectedColumns || selectedColumns.length === 0) {
        throw new Error('No columns specified for visualization');
      }
      
      // Find column indices with fuzzy matching
      const columnIndices = selectedColumns.map(col => {
        // First try exact match
        let index = columns.indexOf(col);
        if (index !== -1) return index;
        
        // Try case-insensitive match
        index = columns.findIndex(c => c.toLowerCase() === col.toLowerCase());
        if (index !== -1) return index;
        
        // Try partial match (contains)
        index = columns.findIndex(c => c.toLowerCase().includes(col.toLowerCase()) || col.toLowerCase().includes(c.toLowerCase()));
        if (index !== -1) return index;
        
        return -1;
      });
      
      const validIndices = columnIndices.filter(idx => idx !== -1);
      
      if (validIndices.length === 0) {
        // If no columns match, use the first few available columns as fallback
        const fallbackIndices = columns.slice(0, Math.min(selectedColumns.length, columns.length)).map((_, idx) => idx);
        if (fallbackIndices.length > 0) {
          console.warn(`Specified columns not found. Using available columns: ${fallbackIndices.map(idx => columns[idx]).join(', ')}`);
          const processedData = createFallbackData(rows, fallbackIndices, columns, chartType || 'bar');
          setChartData(processedData);
          return;
        }
        throw new Error(`Specified columns not found in data. Available columns: ${columns.join(', ')}`);
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
      setCurrentChartType(processedData.type);
      
      // Auto-detect axes for interactive charts
      if (processedData.type !== 'table') {
        const detectedAxes = autoDetectAxes(data.columns);
        setSelectedAxes(detectedAxes);
        setShowAxisControls(true);
      }
    } catch (error) {
      console.error('Error processing data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setChartData({ 
        error: errorMessage,
        availableColumns: data.columns 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateChartWithAxes = () => {
    console.log('=== updateChartWithAxes called ===');
    console.log('selectedAxes:', selectedAxes);
    console.log('currentChartType:', currentChartType);
    
    if (!selectedAxes || !data) {
      console.log('Returning early: missing selectedAxes or data');
      return;
    }
    
    const { columns, rows } = data;
    const xIndex = columns.indexOf(selectedAxes.x);
    const yIndex = columns.indexOf(selectedAxes.y);
    
    console.log('Column indices - X:', xIndex, 'Y:', yIndex);
    
    if (xIndex === -1 || yIndex === -1) {
      console.error('Invalid axis indices - column not found in data');
      return;
    }
    
    console.log('Creating chart data...');
    let updatedData;
    switch (currentChartType) {
      case 'bar':
        console.log('Creating bar chart');
        updatedData = createBarChartData(rows, [xIndex, yIndex], columns);
        break;
      case 'line':
        console.log('Creating line chart');
        updatedData = createLineChartData(rows, [xIndex, yIndex], columns);
        break;
      case 'pie':
        console.log('Creating pie chart');
        updatedData = createPieChartWithValues(rows, xIndex, yIndex, columns);
        break;
      default:
        console.log('Chart type not supported:', currentChartType);
        return;
    }
    
    console.log('Chart data created:', updatedData);
    console.log('Setting chart data...');
    setChartData(updatedData);
    console.log('=== updateChartWithAxes complete ===');
  };

  const changeChartType = (newType: string) => {
    setCurrentChartType(newType);
    // Only update if not scatter (we're removing it)
    if (newType !== 'scatter') {
      updateChartWithAxes();
    }
  };

  const createBarChartData = (rows: any[][], indices: number[], columns: string[]) => {
    // For bar charts, use first index as x-axis (categories) and second as y-axis (values)
    const xIndex = indices[0];
    const yIndex = indices[1];
    
    const grouped: { [key: string]: number } = {};
    
    rows.forEach(row => {
      const key = row[xIndex];
      const value = parseFloat(row[yIndex]) || 0;
      grouped[key] = (grouped[key] || 0) + value;
    });
    
    return {
      type: 'bar',
      labels: Object.keys(grouped),
      datasets: [{
        label: columns[yIndex] || 'Value',
        data: Object.values(grouped),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };

  const createLineChartData = (rows: any[][], indices: number[], columns: string[]) => {
    const xIndex = indices[0];
    const yIndex = indices[1];
    
    // Sort by x-axis value
    const sortedRows = [...rows].sort((a, b) => {
      const aVal = a[xIndex];
      const bVal = b[xIndex];
      // Try numeric comparison first
      if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))) {
        return parseFloat(aVal) - parseFloat(bVal);
      }
      return String(aVal).localeCompare(String(bVal));
    });
    
    return {
      type: 'line',
      labels: sortedRows.map(row => String(row[xIndex])),
      datasets: [{
        label: columns[yIndex] || 'Value',
        data: sortedRows.map(row => parseFloat(row[yIndex]) || 0),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1
      }]
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

  const createPieChartWithValues = (rows: any[][], categoryIndex: number, valueIndex: number, columns: string[]) => {
    // Group by category and sum the values
    const grouped: { [key: string]: number } = {};
    
    rows.forEach(row => {
      const category = String(row[categoryIndex]);
      const value = parseFloat(row[valueIndex]) || 0;
      grouped[category] = (grouped[category] || 0) + value;
    });
    
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];
    
    return {
      type: 'pie',
      labels: Object.keys(grouped),
      datasets: [{
        label: columns[valueIndex] || 'Value',
        data: Object.values(grouped),
        backgroundColor: colors.slice(0, Object.keys(grouped).length),
        borderWidth: 1
      }]
    };
  };

  const createScatterChartData = (rows: any[][], indices: number[], columns: string[]) => {
    const xIndex = indices[0];
    const yIndex = indices[1];
    
    return {
      type: 'scatter',
      datasets: [{
        label: `${columns[xIndex]} vs ${columns[yIndex]}`,
        data: rows.map(row => ({
          x: parseFloat(row[xIndex]) || 0,
          y: parseFloat(row[yIndex]) || 0
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

  const createFallbackData = (rows: any[][], indices: number[], columns: string[], chartType: string) => {
    // Create a simple visualization using available columns
    switch (chartType) {
      case 'bar':
        return createBarChartData(rows, indices, columns);
      case 'line':
        return createLineChartData(rows, indices, columns);
      case 'pie':
        return createPieChartData(rows, indices, columns);
      case 'scatter':
        return createScatterChartData(rows, indices, columns);
      case 'histogram':
        return createHistogramData(rows, indices[0], columns);
      default:
        return createTableData(rows, indices, columns);
    }
  };

  const downloadChart = (format: 'png' | 'svg' = 'png') => {
    if (!chartRef.current) return;
    
    const canvas = chartRef.current.canvas;
    const url = canvas.toDataURL(`image/${format}`);
    
    const link = document.createElement('a');
    link.download = `${suggestion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDFReport = async () => {
    if (!dataSummary) {
      console.error('Data summary not available for PDF generation');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const pdfData: PDFReportData = {
        datasetName: dataSummary.datasetName,
        totalRows: dataSummary.totalRows,
        totalColumns: dataSummary.totalColumns,
        columns: dataSummary.columns,
        metadata: metadata,
        chartData: chartData,
        chartTitle: suggestion.title,
        chartDescription: suggestion.description,
        chartType: currentChartType || suggestion.chartType,
        dataTable: data.rows
      };

      // Get the chart element for capture - try to get the canvas or its container
      let chartElement: HTMLElement | undefined;
      if (chartRef.current?.canvas) {
        // For Chart.js, get the canvas element or its parent container
        chartElement = chartRef.current.canvas.parentElement || chartRef.current.canvas;
      }
      
      console.log('Chart element for PDF:', chartElement);
      
      // Add a small delay to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      pdfGenerator.downloadReport(pdfData, chartElement, `${dataSummary.datasetName}_report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
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
          <p className="text-gray-300 mb-4">{chartData.error}</p>
          {chartData.availableColumns && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Available columns:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {chartData.availableColumns.map((col: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-semibold text-white">{suggestion.title}</h3>
            <p className="text-gray-300 text-sm">{suggestion.description}</p>
          </div>
          <div className="flex space-x-2">
            {chartData?.type !== 'table' && (
              <>
                <button
                  onClick={() => downloadChart('png')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => downloadChart('svg')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>SVG</span>
                </button>
              </>
            )}
            {onExportReport && (
              <button
                onClick={onExportReport}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center space-x-1"
                title="Export report as Markdown"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Report</span>
              </button>
            )}
            {dataSummary && (
              <button
                onClick={downloadPDFReport}
                disabled={isGeneratingPDF}
                className={`px-3 py-1 text-white text-sm rounded transition-colors flex items-center space-x-1 ${
                  isGeneratingPDF 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                title="Download PDF report with data table, metadata, and chart"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>PDF</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Show/Hide Controls Button */}
        {selectedAxes && chartData?.type !== 'table' && !showAxisControls && (
          <div className="mt-4">
            <button
              onClick={() => setShowAxisControls(true)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Show Chart Controls</span>
            </button>
          </div>
        )}
        
        {/* Chart Type and Axis Controls */}
        {showAxisControls && selectedAxes && chartData?.type !== 'table' && (
          <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">Chart Controls</h4>
              <button
                onClick={() => setShowAxisControls(false)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
              >
                Hide Controls
              </button>
            </div>
            
            {/* Chart Type Selector */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Chart Type</label>
              <select
                value={currentChartType}
                onChange={(e) => changeChartType(e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {currentChartType === 'pie' ? 'Category' : 'X-Axis'}
                </label>
                <select
                  value={selectedAxes.x}
                  onChange={(e) => setSelectedAxes({...selectedAxes, x: e.target.value})}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {data.columns.map((col, index) => (
                    <option key={index} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              {currentChartType !== 'pie' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Y-Axis</label>
                  <select
                    value={selectedAxes.y}
                    onChange={(e) => setSelectedAxes({...selectedAxes, y: e.target.value})}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {data.columns.map((col, index) => (
                      <option key={index} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}
              {currentChartType === 'pie' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Value</label>
                  <select
                    value={selectedAxes.y}
                    onChange={(e) => setSelectedAxes({...selectedAxes, y: e.target.value})}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {data.columns.map((col, index) => (
                      <option key={index} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                Current: {selectedAxes.x} {currentChartType === 'pie' ? '→' : 'vs'} {selectedAxes.y}
              </span>
              <button
                onClick={updateChartWithAxes}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
              >
                Update Chart
              </button>
            </div>
          </div>
        )}
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
        <div className="h-96 bg-gray-900/50 rounded-lg p-4">
          {currentChartType === 'bar' && (
            <Bar 
              ref={chartRef}
              data={{
                labels: chartData.labels,
                datasets: chartData.datasets
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: '#d1d5db'
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      color: '#d1d5db'
                    },
                    grid: {
                      color: '#374151'
                    }
                  },
                  y: {
                    ticks: {
                      color: '#d1d5db'
                    },
                    grid: {
                      color: '#374151'
                    }
                  }
                }
              }}
            />
          )}
          
          {currentChartType === 'line' && (
            <Line 
              ref={chartRef}
              data={{
                labels: chartData.labels,
                datasets: chartData.datasets
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: '#d1d5db'
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      color: '#d1d5db'
                    },
                    grid: {
                      color: '#374151'
                    }
                  },
                  y: {
                    ticks: {
                      color: '#d1d5db'
                    },
                    grid: {
                      color: '#374151'
                    }
                  }
                }
              }}
            />
          )}
          
          {currentChartType === 'pie' && (
            <Pie 
              ref={chartRef}
              data={{
                labels: chartData.labels,
                datasets: chartData.datasets
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: '#d1d5db'
                    }
                  }
                }
              }}
            />
          )}
          
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
