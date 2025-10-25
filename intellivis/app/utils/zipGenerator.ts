import JSZip from 'jszip';

export interface ZipFile {
  name: string;
  content: string;
}

export class ZipGenerator {
  static async createZip(files: ZipFile[], folderName: string): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder(folderName);
    
    if (!folder) {
      throw new Error('Failed to create folder in zip');
    }

    // Add files to the folder
    files.forEach(file => {
      folder.file(file.name, file.content);
    });

    // Generate the zip file
    return await zip.generateAsync({ type: 'blob' });
  }

  static downloadZip(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static sanitizeFolderName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
