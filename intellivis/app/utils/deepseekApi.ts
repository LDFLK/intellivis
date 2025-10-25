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
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from DeepSeek API');
      }
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(content);
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

Available chart types: bar, line, pie, scatter, histogram, heatmap
Available types: chart, table, statistics, analysis

Focus on the most valuable and interesting visualizations for this specific dataset.
    `.trim();
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
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from DeepSeek API');
      }
      
      const parsedResponse = JSON.parse(content);
      return parsedResponse;
      
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error(`Failed to generate custom visualization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
