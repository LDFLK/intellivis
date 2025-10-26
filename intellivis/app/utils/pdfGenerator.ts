import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFReportData {
  datasetName: string;
  totalRows: number;
  totalColumns: number;
  columns: string[];
  metadata?: any;
  chartData?: any;
  chartTitle?: string;
  chartDescription?: string;
  chartType?: string;
  dataTable?: any[][];
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addTitle(text: string, fontSize: number = 18) {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += fontSize + 5;
  }

  private addSubtitle(text: string, fontSize: number = 14) {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += fontSize + 3;
  }

  private addText(text: string, fontSize: number = 10) {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    
    // Split text into lines that fit the page width
    const maxWidth = this.pageWidth - (2 * this.margin);
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += (lines.length * fontSize * 0.4) + 2;
  }

  private addNewPage() {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private checkPageBreak(requiredSpace: number): boolean {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.addNewPage();
      return true;
    }
    return false;
  }

  private addMetadataSection(data: PDFReportData) {
    this.addSubtitle('Dataset Information');
    
    const metadataText = [
      `Dataset Name: ${data.datasetName}`,
      `Total Rows: ${data.totalRows.toLocaleString()}`,
      `Total Columns: ${data.totalColumns}`,
      `Columns: ${data.columns.join(', ')}`
    ].join('\n');

    this.addText(metadataText);
    this.currentY += 10;

    // Add additional metadata if available
    if (data.metadata) {
      this.addSubtitle('Additional Metadata');
      
      // Format metadata in a more readable way instead of JSON
      if (typeof data.metadata === 'object' && data.metadata !== null) {
        const metadataEntries = Object.entries(data.metadata);
        metadataEntries.forEach(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          this.addText(`${formattedKey}: ${formattedValue}`);
        });
      } else {
        this.addText(String(data.metadata));
      }
      this.currentY += 10;
    }
  }

  private addDataTableSection(data: PDFReportData) {
    if (!data.dataTable || data.dataTable.length === 0) {
      return;
    }

    this.addSubtitle('Data Preview');
    
    // Limit table to first 20 rows for PDF readability
    const tableData = data.dataTable.slice(0, 20);
    const columns = data.columns;
    
    // Calculate column widths
    const tableWidth = this.pageWidth - (2 * this.margin);
    const colWidth = tableWidth / columns.length;
    
    // Add table headers
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    
    let x = this.margin;
    columns.forEach((col, index) => {
      this.doc.text(col, x, this.currentY);
      x += colWidth;
    });
    
    this.currentY += 5;
    
    // Add table rows
    this.doc.setFont('helvetica', 'normal');
    tableData.forEach((row, rowIndex) => {
      this.checkPageBreak(15);
      
      x = this.margin;
      row.forEach((cell, colIndex) => {
        const cellText = String(cell || '').substring(0, 20); // Truncate long text
        this.doc.text(cellText, x, this.currentY);
        x += colWidth;
      });
      
      this.currentY += 4;
    });
    
    if (data.dataTable.length > 20) {
      this.currentY += 5;
      this.addText(`Showing first 20 rows of ${data.dataTable.length} total rows`);
    }
    
    this.currentY += 10;
  }

  private async addChartSection(data: PDFReportData, chartElement?: HTMLElement) {
    if (!data.chartTitle) {
      return;
    }

    this.addSubtitle('Visualization');
    this.addText(`Title: ${data.chartTitle}`);
    
    if (data.chartDescription) {
      this.addText(`Description: ${data.chartDescription}`);
    }
    
    if (data.chartType) {
      this.addText(`Chart Type: ${data.chartType}`);
    }

    this.currentY += 10;

    // Add chart image if available
    if (chartElement) {
      try {
        this.checkPageBreak(100);
        
        // Try to find the actual canvas element within the chart container
        const canvas = chartElement.querySelector('canvas') as HTMLCanvasElement;
        const targetElement = canvas || chartElement;
        
        console.log('Capturing chart element:', targetElement);
        
        let imgData: string;
        
        // First try: Use canvas.toDataURL directly if it's a canvas element
        if (canvas && canvas.tagName === 'CANVAS') {
          try {
            imgData = canvas.toDataURL('image/png');
            console.log('Used canvas.toDataURL directly');
          } catch (canvasError) {
            console.log('Canvas.toDataURL failed, trying html2canvas:', canvasError);
            throw canvasError; // Fall through to html2canvas
          }
        } else {
          // Second try: Use html2canvas
          const html2canvasResult = await html2canvas(targetElement, {
            backgroundColor: '#1f2937', // Dark background to match the app
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: targetElement.scrollWidth,
            height: targetElement.scrollHeight
          });
          
          console.log('Canvas captured with html2canvas:', html2canvasResult);
          imgData = html2canvasResult.toDataURL('image/png');
        }
        
        // Calculate image dimensions
        const tempImg = new Image();
        tempImg.src = imgData;
        
        // Wait for image to load to get dimensions
        await new Promise((resolve) => {
          tempImg.onload = resolve;
        });
        
        const imgWidth = this.pageWidth - (2 * this.margin);
        const imgHeight = (tempImg.height * imgWidth) / tempImg.width;
        
        // Ensure image fits on page
        const maxHeight = this.pageHeight - this.currentY - this.margin;
        const finalHeight = Math.min(imgHeight, maxHeight);
        const finalWidth = (tempImg.width * finalHeight) / tempImg.height;
        
        this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, finalWidth, finalHeight);
        this.currentY += finalHeight + 10;
      } catch (error) {
        console.error('Error capturing chart:', error);
        this.addText('Chart could not be captured in PDF');
        this.addText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      this.addText('Chart visualization not available in PDF format');
    }
  }

  private addFooter() {
    const footerY = this.pageHeight - 15;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Generated by OpenGIN Intellivis', this.margin, footerY);
    this.doc.text(new Date().toLocaleDateString(), this.pageWidth - this.margin - 30, footerY);
  }

  async generateReport(data: PDFReportData, chartElement?: HTMLElement): Promise<Blob> {
    // Reset document
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = this.margin;

    // Add title
    this.addTitle('Data Visualization Report');
    this.currentY += 10;

    // Add metadata section
    this.addMetadataSection(data);
    
    // Add data table section
    this.addDataTableSection(data);
    
    // Add chart section
    await this.addChartSection(data, chartElement);
    
    // Add footer to all pages
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.addFooter();
    }

    return this.doc.output('blob');
  }

  downloadReport(data: PDFReportData, chartElement?: HTMLElement, filename?: string) {
    this.generateReport(data, chartElement).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${data.datasetName}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }).catch(error => {
      console.error('Error generating PDF:', error);
    });
  }
}

export const pdfGenerator = new PDFGenerator();
