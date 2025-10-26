export interface ProcessedData {
  type: 'json' | 'csv' | 'text' | 'excel';
  data: any;
  metadata: {
    fileName: string;
    fileSize: number;
    rowCount?: number;
    columns?: string[];
  };
}

export class FileProcessor {
  static async processFile(file: File): Promise<ProcessedData> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'json':
        return this.processJSON(file);
      case 'csv':
        return this.processCSV(file);
      case 'txt':
        return this.processText(file);
      case 'xlsx':
      case 'xls':
        return this.processExcel(file);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  private static async processJSON(file: File): Promise<ProcessedData> {
    const text = await this.readFileAsText(file);
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    return {
      type: 'json',
      data,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        rowCount: Array.isArray(data) ? data.length : 1,
        columns: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : []
      }
    };
  }

  private static async processCSV(file: File): Promise<ProcessedData> {
    const text = await this.readFileAsText(file);
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(value => value.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    return {
      type: 'csv',
      data: rows,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        rowCount: rows.length,
        columns: headers
      }
    };
  }

  private static async processText(file: File): Promise<ProcessedData> {
    const text = await this.readFileAsText(file);
    const lines = text.split('\n');

    return {
      type: 'text',
      data: {
        content: text,
        lines: lines,
        wordCount: text.split(/\s+/).filter(word => word.length > 0).length
      },
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        rowCount: lines.length
      }
    };
  }

  private static async processExcel(file: File): Promise<ProcessedData> {
    // For Excel files, we'll need to use a library like xlsx
    // This is a simplified version that reads as text first
    const text = await this.readFileAsText(file);
    
    return {
      type: 'excel',
      data: {
        content: text,
        message: 'Excel file detected. For full Excel support, consider using the xlsx library.'
      },
      metadata: {
        fileName: file.name,
        fileSize: file.size
      }
    };
  }

  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Utility method to download processed data as JSON
  static downloadAsJSON(data: any, filename: string = 'data.json') {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Utility method to convert CSV data to downloadable CSV
  static downloadAsCSV(data: any[], filename: string = 'data.csv') {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be an array of objects');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
