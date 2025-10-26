export interface VisualizationSuggestion {
  type: 'chart' | 'table' | 'statistics' | 'analysis';
  title: string;
  description: string;
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'heatmap';
  columns?: string[];
  reasoning: string;
}

export interface DeepSeekResponse {
  suggestions: VisualizationSuggestion[];
  analysis: string;
  insights: string[];
}

export class DeepSeekAPI {
  private static readonly API_URL = 'https://api.deepseek.com/v1/chat/completions';
  private static readonly MODEL = 'deepseek-chat';
  
  private static validateApiKey(apiKey: string): void {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required');
    }
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format. DeepSeek API keys should start with "sk-"');
    }
  }

  private static extractJsonFromResponse(content: string): any {
    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // Try to find JSON object in the content
    const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      return JSON.parse(jsonObjectMatch[0]);
    }
    
    // If no markdown or JSON object found, try parsing the entire content
    return JSON.parse(content.trim());
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    this.validateApiKey(apiKey);
    
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message. Please respond with "API key is working correctly."'
            }
          ],
          temperature: 0.1,
          max_tokens: 50
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API key authentication failed');
        }
        throw new Error(`API test failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices && data.choices.length > 0;
      
    } catch (error) {
      console.error('API Key Test Error:', error);
      throw error;
    }
  }
  
  static async generateVisualizationSuggestions(
    dataSummary: {
      datasetName: string;
      totalRows: number;
      totalColumns: number;
      columns: string[];
      sampleData: any[][];
    },
    apiKey: string
  ): Promise<DeepSeekResponse> {
    const prompt = this.buildPrompt(dataSummary);
    
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a data visualization expert. Analyze the provided dataset and suggest appropriate visualizations. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('DeepSeek API authentication failed. Please check your API key.');
        }
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from DeepSeek API');
      }
      
      // Extract and parse JSON from the response
      const parsedResponse = this.extractJsonFromResponse(content);
      return parsedResponse;
      
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error(`Failed to generate visualization suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private static buildPrompt(dataSummary: {
    datasetName: string;
    totalRows: number;
    totalColumns: number;
    columns: string[];
    sampleData: any[][];
  }): string {
    return `
Analyze this dataset and suggest 3-5 appropriate visualizations:

Dataset: ${dataSummary.datasetName}
Rows: ${dataSummary.totalRows}
Columns: ${dataSummary.totalColumns}
Column Names: ${dataSummary.columns.join(', ')}

Sample Data (first 5 rows):
${dataSummary.sampleData.map(row => row.join(', ')).join('\n')}

Please respond with a JSON object in this exact format:
{
  "suggestions": [
    {
      "type": "chart",
      "title": "Chart Title",
      "description": "What this chart shows",
      "chartType": "bar",
      "columns": ["column1", "column2"],
      "reasoning": "Why this visualization is useful"
    }
  ],
  "analysis": "Overall analysis of the dataset",
  "insights": ["Key insight 1", "Key insight 2"]
}

IMPORTANT: Only use these supported chart types: bar, line, pie
Available types: chart

Focus on the most valuable and interesting visualizations for this specific dataset.
    `.trim();
  }
  
  static async generateCustomVisualizationWithContext(
    userRequest: string,
    dataSummary: {
      datasetName: string;
      totalRows: number;
      totalColumns: number;
      columns: string[];
      sampleData: any[][];
    },
    apiKey: string,
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<VisualizationSuggestion> {
    this.validateApiKey(apiKey);
    
    const prompt = `
User Request: "${userRequest}"

Dataset: ${dataSummary.datasetName}
Columns: ${dataSummary.columns.join(', ')}
Sample Data: ${dataSummary.sampleData.slice(0, 3).map(row => row.join(', ')).join('\n')}

Based on the user's request and the dataset, suggest a specific visualization. Consider the conversation context and previous requests.
Respond with JSON:
{
  "type": "chart",
  "title": "Chart Title",
  "description": "Description",
  "chartType": "bar",
  "columns": ["column1", "column2"],
  "reasoning": "Why this visualization answers the user's request"
}
    `.trim();
    
    try {
      // Build conversation context
      const messages = [
        {
          role: 'system',
          content: 'You are a data visualization expert. Create specific visualizations based on user requests and conversation context. Always respond with valid JSON.'
        },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('DeepSeek API authentication failed. Please check your API key.');
        }
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from DeepSeek API');
      }
      
      // Extract and parse JSON from the response
      const parsedResponse = this.extractJsonFromResponse(content);
      return parsedResponse;
      
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error(`Failed to generate custom visualization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateCustomVisualization(
    userRequest: string,
    dataSummary: {
      datasetName: string;
      totalRows: number;
      totalColumns: number;
      columns: string[];
      sampleData: any[][];
    },
    apiKey: string
  ): Promise<VisualizationSuggestion> {
    this.validateApiKey(apiKey);
    
    const prompt = `
User Request: "${userRequest}"

Dataset: ${dataSummary.datasetName}
Columns: ${dataSummary.columns.join(', ')}
Sample Data: ${dataSummary.sampleData.slice(0, 3).map(row => row.join(', ')).join('\n')}

Based on the user's request and the dataset, suggest a specific visualization. Respond with JSON:
{
  "type": "chart",
  "title": "Chart Title",
  "description": "Description",
  "chartType": "bar",
  "columns": ["column1", "column2"],
  "reasoning": "Why this visualization answers the user's request"
}
    `.trim();
    
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a data visualization expert. Create specific visualizations based on user requests. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('DeepSeek API authentication failed. Please check your API key.');
        }
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from DeepSeek API');
      }
      
      // Extract and parse JSON from the response
      const parsedResponse = this.extractJsonFromResponse(content);
      return parsedResponse;
      
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error(`Failed to generate custom visualization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
