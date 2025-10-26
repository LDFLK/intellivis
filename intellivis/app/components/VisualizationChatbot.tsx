'use client';

import { useState, useRef, useEffect } from 'react';
import { DeepSeekAPI, VisualizationSuggestion } from '../utils/deepseekApi';

interface VisualizationChatbotProps {
  dataSummary: {
    datasetName: string;
    totalRows: number;
    totalColumns: number;
    columns: string[];
    sampleData: any[][];
  };
  apiKey: string;
  onVisualizationRequest: (suggestion: VisualizationSuggestion) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestion?: VisualizationSuggestion;
}

interface ChatContext {
  dataSummary: {
    datasetName: string;
    totalRows: number;
    totalColumns: number;
    columns: string[];
    sampleData: any[][];
  };
  conversationHistory: ChatMessage[];
  lastAnalysis?: string;
}

export default function VisualizationChatbot({
  dataSummary,
  apiKey,
  onVisualizationRequest
}: VisualizationChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [intelligentSuggestions, setIntelligentSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load saved suggestions if available
    const savedSuggestions = localStorage.getItem(`suggestions_${dataSummary?.datasetName}`);
    if (savedSuggestions) {
      setIntelligentSuggestions(JSON.parse(savedSuggestions));
    } else {
      generateIntelligentSuggestions();
    }
  }, [dataSummary]);

  useEffect(() => {
    // Save suggestions to localStorage when they change
    if (intelligentSuggestions.length > 0) {
      localStorage.setItem(`suggestions_${dataSummary?.datasetName}`, JSON.stringify(intelligentSuggestions));
    }
  }, [intelligentSuggestions, dataSummary?.datasetName]);

  const generateIntelligentSuggestions = async () => {
    if (!apiKey || !dataSummary) return;
    
    setIsGeneratingSuggestions(true);
    try {
      const analysisPrompt = `
Analyze this dataset and suggest 5 specific, actionable visualization requests that would be most valuable for this data:

Dataset: ${dataSummary.datasetName}
Rows: ${dataSummary.totalRows}
Columns: ${dataSummary.columns.join(', ')}
Sample Data (first 3 rows):
${dataSummary.sampleData.slice(0, 3).map(row => row.join(', ')).join('\n')}

Based on the actual data structure and content, suggest 5 specific visualization requests that would provide meaningful insights. Consider:
- Data types and patterns in the columns
- Relationships between variables
- Potential trends or distributions
- Business value of different visualizations

Respond with exactly 5 suggestions, one per line, as specific user requests (e.g., "Show me a bar chart of sales by region").
      `.trim();

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a data visualization expert. Analyze datasets and suggest specific, actionable visualization requests. Respond with exactly 5 suggestions, one per line.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          const suggestions = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .slice(0, 5);
          setIntelligentSuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error('Error generating intelligent suggestions:', error);
      // Fallback to default suggestions
      setIntelligentSuggestions([
        "Show me a bar chart of the most common values",
        "Create a line chart showing trends over time", 
        "Generate a pie chart of the data distribution",
        "Show me statistics summary",
        "Create a scatter plot comparing two variables"
      ]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const regenerateSuggestions = () => {
    localStorage.removeItem(`suggestions_${dataSummary?.datasetName}`);
    setIntelligentSuggestions([]);
    generateIntelligentSuggestions();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false); // Hide suggestions when clicked
    handleSendMessage(); // Process the suggestion immediately
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create conversation context for the AI
      const conversationContext = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const suggestion = await DeepSeekAPI.generateCustomVisualizationWithContext(
        inputValue.trim(),
        dataSummary,
        apiKey,
        conversationContext
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I've created a ${suggestion.chartType} chart for you: "${suggestion.title}". ${suggestion.description}`,
        timestamp: new Date(),
        suggestion
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I couldn't process your request. ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  const quickSuggestions = intelligentSuggestions.length > 0 ? intelligentSuggestions : [
    "Show me a bar chart of the most common values",
    "Create a line chart showing trends over time",
    "Generate a pie chart of the data distribution",
    "Show me statistics summary",
    "Create a scatter plot comparing two variables"
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 h-96 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Visualization Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
          >
            {showSuggestions ? 'Hide' : 'Show'} Suggestions
          </button>
          {intelligentSuggestions.length > 0 && (
            <button
              onClick={regenerateSuggestions}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              disabled={isGeneratingSuggestions}
            >
              {isGeneratingSuggestions ? 'Generating...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p>Ask me to create visualizations for your data!</p>
            <p className="text-sm mt-2">Try: "Show me a bar chart of sales by region"</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.suggestion && (
                <button
                  onClick={() => onVisualizationRequest(message.suggestion!)}
                  className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
                >
                  Create {message.suggestion.chartType} chart
                </button>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {showSuggestions && (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            {isGeneratingSuggestions ? 'Analyzing your data...' : 'Smart suggestions based on your data:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {isGeneratingSuggestions ? (
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Generating intelligent suggestions...</span>
              </div>
            ) : (
              quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me to create a visualization..."
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
