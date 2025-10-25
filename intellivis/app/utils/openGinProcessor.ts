export interface OpenGinMetadata {
  dataSource: string;
  dateOfCreation: string;
  dataEntryPerson: string;
  importantUrls: string[];
  description: string;
}

export interface OpenGinTabularFormat {
  datasetName: string;
  metadata: OpenGinMetadata;
  columns: string[];
  rows: any[][];
}

export interface ProcessedFileData {
  fileName: string;
  fileSize: number;
  data: any[];
  columns: string[];
  rowCount: number;
}

export class OpenGinProcessor {
  static async processFile(file: File): Promise<ProcessedFileData> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      return this.processCSV(file);
    } else if (fileExtension === 'json') {
      return this.processJSON(file);
    } else {
      throw new Error('Only CSV and JSON files are supported');
    }
  }

  private static async processCSV(file: File): Promise<ProcessedFileData> {
    const text = await this.readFileAsText(file);
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const dataRows = lines.slice(1).map(line => {
      const values = line.split(',').map(value => value.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    return {
      fileName: file.name,
      fileSize: file.size,
      data: dataRows,
      columns: headers,
      rowCount: dataRows.length
    };
  }

  private static async processJSON(file: File): Promise<ProcessedFileData> {
    const text = await this.readFileAsText(file);
    let jsonData;
    
    try {
      jsonData = JSON.parse(text);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    // Check if it's already in OpenGIN format (has columns and rows)
    if (jsonData.columns && jsonData.rows && Array.isArray(jsonData.columns) && Array.isArray(jsonData.rows)) {
      // It's already in OpenGIN format, convert it back to tabular format for processing
      const data = jsonData.rows.map((row: any[]) => {
        const rowObj: Record<string, any> = {};
        jsonData.columns.forEach((col: string, index: number) => {
          rowObj[col] = row[index];
        });
        return rowObj;
      });

      return {
        fileName: file.name,
        fileSize: file.size,
        data: data,
        columns: jsonData.columns,
        rowCount: jsonData.rows.length
      };
    }

    // Check if it's an array of objects (traditional JSON format)
    if (Array.isArray(jsonData)) {
      if (jsonData.length === 0) {
        throw new Error('JSON file must contain at least one object');
      }

      const columns = Object.keys(jsonData[0]);
      
      return {
        fileName: file.name,
        fileSize: file.size,
        data: jsonData,
        columns: columns,
        rowCount: jsonData.length
      };
    }

    throw new Error('JSON file must be either an array of objects or have columns/rows structure');
  }

  static convertToOpenGinFormat(
    processedData: ProcessedFileData,
    datasetName: string,
    metadata: OpenGinMetadata
  ): OpenGinTabularFormat {
    // Use the actual column names from the CSV/JSON
    const columns = processedData.columns;
    const rows: any[][] = [];

    // Convert each row of data to OpenGIN format
    processedData.data.forEach((row) => {
      // Create an array of values in the same order as columns
      const rowValues = columns.map(column => row[column]);
      rows.push(rowValues);
    });

    return {
      datasetName,
      metadata,
      columns,
      rows
    };
  }

  private static detectType(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'null';
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    
    if (typeof value === 'string') {
      // Check if it's a date
      if (this.isDateString(value)) {
        return 'date';
      }
      
      // Check if it's a URL
      if (this.isUrl(value)) {
        return 'url';
      }
      
      // Check if it's an email
      if (this.isEmail(value)) {
        return 'email';
      }
      
      return 'string';
    }
    
    return 'unknown';
  }

  private static isDateString(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && !!value.match(/^\d{4}-\d{2}-\d{2}/);
  }

  private static isUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private static isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
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

  static downloadOpenGinFormat(openGinData: OpenGinTabularFormat, filename?: string) {
    const jsonString = JSON.stringify(openGinData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${openGinData.datasetName}-opengin.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
