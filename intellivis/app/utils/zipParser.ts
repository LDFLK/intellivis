import JSZip from 'jszip';

export interface ParsedOpenGinData {
  data: {
    columns: string[];
    rows: any[][];
  };
  metadata: {
    datasetName: string;
    metadata: {
      dataSource: string;
      dateOfCreation: string;
      dataEntryPerson: string;
      importantUrls: string[];
      description: string;
      categories: any[];
    };
  };
}

export class ZipParser {
  static async parseOpenGinZip(file: File): Promise<ParsedOpenGinData> {
    try {
      const zip = await JSZip.loadAsync(file);
      
      // Debug: Log all files in the ZIP
      console.log('Files in ZIP:', Object.keys(zip.files));
      
      // Check if required files exist (handle both root and subfolder cases)
      let dataFile = zip.file('data.json');
      let metadataFile = zip.file('metadata.json');
      
      // If files are not in root, check subfolders
      if (!dataFile || !metadataFile) {
        const allFiles = Object.keys(zip.files);
        console.log('Searching for files in subfolders...');
        
        // Look for files in any subfolder (OpenGIN ZIP files have files in a subfolder)
        for (const fileName of allFiles) {
          if (fileName.endsWith('/data.json') && !dataFile) {
            dataFile = zip.file(fileName);
            console.log('Found data.json at:', fileName);
          }
          if (fileName.endsWith('/metadata.json') && !metadataFile) {
            metadataFile = zip.file(fileName);
            console.log('Found metadata.json at:', fileName);
          }
        }
        
        // If still not found, try any file ending with the names
        if (!dataFile || !metadataFile) {
          for (const fileName of allFiles) {
            if (fileName.endsWith('data.json') && !dataFile) {
              dataFile = zip.file(fileName);
              console.log('Found data.json at:', fileName);
            }
            if (fileName.endsWith('metadata.json') && !metadataFile) {
              metadataFile = zip.file(fileName);
              console.log('Found metadata.json at:', fileName);
            }
          }
        }
      }
      
      if (!dataFile || !metadataFile) {
        const availableFiles = Object.keys(zip.files).filter(name => !name.endsWith('/'));
        const dataFiles = availableFiles.filter(name => name.includes('data.json'));
        const metadataFiles = availableFiles.filter(name => name.includes('metadata.json'));
        
        let errorMessage = 'Invalid OpenGIN ZIP file. Missing data.json or metadata.json.';
        if (dataFiles.length > 0) {
          errorMessage += ` Found data files: ${dataFiles.join(', ')}`;
        }
        if (metadataFiles.length > 0) {
          errorMessage += ` Found metadata files: ${metadataFiles.join(', ')}`;
        }
        errorMessage += ` All files: ${availableFiles.join(', ')}`;
        
        throw new Error(errorMessage);
      }
      
      // Parse data.json
      const dataContent = await dataFile.async('text');
      const data = JSON.parse(dataContent);
      
      // Parse metadata.json
      const metadataContent = await metadataFile.async('text');
      const metadata = JSON.parse(metadataContent);
      
      // Validate structure
      if (!data.columns || !data.rows || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
        throw new Error('Invalid data.json structure. Expected columns and rows arrays.');
      }
      
      if (!metadata.datasetName || !metadata.metadata) {
        throw new Error('Invalid metadata.json structure. Expected datasetName and metadata.');
      }
      
      return {
        data,
        metadata
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse OpenGIN ZIP file: ${error.message}`);
      }
      throw new Error('Failed to parse OpenGIN ZIP file: Unknown error');
    }
  }
  
  static validateOpenGinData(parsedData: ParsedOpenGinData): boolean {
    try {
      const { data, metadata } = parsedData;
      
      // Validate data structure
      if (!Array.isArray(data.columns) || data.columns.length === 0) {
        return false;
      }
      
      if (!Array.isArray(data.rows) || data.rows.length === 0) {
        return false;
      }
      
      // Check if all rows have the same number of columns
      const expectedColumns = data.columns.length;
      for (const row of data.rows) {
        if (!Array.isArray(row) || row.length !== expectedColumns) {
          return false;
        }
      }
      
      // Validate metadata structure
      if (!metadata.datasetName || typeof metadata.datasetName !== 'string') {
        return false;
      }
      
      if (!metadata.metadata || typeof metadata.metadata !== 'object') {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  static getDataSummary(parsedData: ParsedOpenGinData): {
    datasetName: string;
    totalRows: number;
    totalColumns: number;
    columns: string[];
    sampleData: any[][];
  } {
    const { data, metadata } = parsedData;
    
    return {
      datasetName: metadata.datasetName,
      totalRows: data.rows.length,
      totalColumns: data.columns.length,
      columns: data.columns,
      sampleData: data.rows.slice(0, 5) // First 5 rows as sample
    };
  }
}
