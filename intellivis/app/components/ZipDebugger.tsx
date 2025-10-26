'use client';

import { useState } from 'react';
import JSZip from 'jszip';

interface ZipDebuggerProps {
  onFileSelect: (file: File) => void;
}

export default function ZipDebugger({ onFileSelect }: ZipDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeZip = async (file: File) => {
    setIsAnalyzing(true);
    setDebugInfo('');
    
    try {
      const zip = await JSZip.loadAsync(file);
      const allFiles = Object.keys(zip.files);
      
      let debugOutput = `ZIP Analysis for: ${file.name}\n`;
      debugOutput += `File size: ${file.size} bytes\n`;
      debugOutput += `Total files in ZIP: ${allFiles.length}\n\n`;
      
      debugOutput += 'Files in ZIP:\n';
      allFiles.forEach((fileName, index) => {
        const fileObj = zip.files[fileName];
        debugOutput += `${index + 1}. ${fileName} (${fileObj.dir ? 'DIR' : 'FILE'})\n`;
      });
      
      debugOutput += '\nLooking for OpenGIN files:\n';
      const dataFiles = allFiles.filter(name => name.includes('data.json'));
      const metadataFiles = allFiles.filter(name => name.includes('metadata.json'));
      
      debugOutput += `Data files found: ${dataFiles.length}\n`;
      dataFiles.forEach(file => debugOutput += `  - ${file}\n`);
      
      debugOutput += `Metadata files found: ${metadataFiles.length}\n`;
      metadataFiles.forEach(file => debugOutput += `  - ${file}\n`);
      
      if (dataFiles.length > 0 && metadataFiles.length > 0) {
        debugOutput += '\n✅ OpenGIN files found! This should work.\n';
      } else {
        debugOutput += '\n❌ Missing required OpenGIN files.\n';
      }
      
      setDebugInfo(debugOutput);
    } catch (error) {
      setDebugInfo(`Error analyzing ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">ZIP File Debugger</h3>
      
      <div className="mb-4">
        <input
          type="file"
          accept=".zip"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              analyzeZip(file);
              onFileSelect(file);
            }
          }}
          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
      </div>
      
      {isAnalyzing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-300">Analyzing ZIP file...</p>
        </div>
      )}
      
      {debugInfo && (
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Debug Output:</h4>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  );
}
