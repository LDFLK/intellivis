'use client';

import { VisualizationSuggestion } from '../utils/deepseekApi';

interface VisualizationOptionsPanelProps {
  options: VisualizationSuggestion[];
  onSelectVisualization: (suggestion: VisualizationSuggestion) => void;
  isLoading?: boolean;
}

export default function VisualizationOptionsPanel({
  options,
  onSelectVisualization,
  isLoading
}: VisualizationOptionsPanelProps) {
  const getChartTypeIcon = (type: string) => {
    const iconClass = 'w-5 h-5 text-purple-400';
    switch (type) {
      case 'chart':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'table':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'statistics':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-3">

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mb-2"></div>
            <span className="text-gray-400 text-sm">Generating ideas...</span>
          </div>
        </div>
      ) : options.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No visualization options available yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onSelectVisualization(option)}
              className="w-full p-2.5 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 rounded-lg transition-all hover:border-purple-500/50 group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="flex-shrink-0">
                  {getChartTypeIcon(option.type)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-medium text-xs truncate group-hover:text-purple-300 transition-colors">
                      {option.title}
                    </h4>
                    {option.chartType && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded flex-shrink-0">
                        {option.chartType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
