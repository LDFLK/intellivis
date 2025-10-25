# OpenGIN Data Conversion Workflow

This application provides a multi-step workflow for converting CSV and JSON files to OpenGIN Tabular format with comprehensive metadata collection.

## Workflow Steps

### 1. Upload Page (`/upload`)
- **Purpose**: Upload and preview data files
- **Supported Formats**: CSV files or JSON files with columns/rows structure
- **Features**:
  - Drag & drop file upload
  - File validation (size and format)
  - Data preview (table for CSV, JSON for JSON files)
  - File information display
- **Navigation**: Continue to metadata collection

### 2. Metadata Page (`/metadata`)
- **Purpose**: Collect dataset metadata and information
- **Required Fields**:
  - Data Source
  - Date of Creation
  - Data Entry Person
  - Description
- **Optional Fields**:
  - Important URLs (multiple)
- **Features**:
  - Form validation
  - Dynamic URL fields (add/remove)
  - Date picker for creation date
- **Navigation**: Continue to review or go back to upload

### 3. Review Page (`/review`)
- **Purpose**: Review all data and metadata before generation
- **Features**:
  - Dataset name input (sanitized for folder naming)
  - Data preview
  - Metadata preview
  - Generated files preview
  - Edit metadata option
- **Navigation**: Generate files and continue to download

### 4. Download Page (`/download`)
- **Purpose**: Generate and download OpenGIN format files
- **Generated Files**:
  - `data.json`: OpenGIN tabular format with columns and rows
  - `metadata.json`: Dataset metadata and information
- **Features**:
  - ZIP file generation
  - Folder naming (sanitized dataset name)
  - File structure preview
  - Download statistics
- **Navigation**: Start new dataset or return to home

## File Structure

The generated ZIP file contains:
```
{dataset_name}/
├── data.json          # OpenGIN tabular format
└── metadata.json      # Dataset metadata
```

### data.json Structure
```json
{
  "columns": ["column1", "column2", "column3"],
  "rows": [
    ["value1", "value2", "value3"],
    ["value4", "value5", "value6"]
  ]
}
```

### metadata.json Structure
```json
{
  "datasetName": "string",
  "metadata": {
    "dataSource": "string",
    "dateOfCreation": "YYYY-MM-DD",
    "dataEntryPerson": "string",
    "importantUrls": ["string"],
    "description": "string"
  }
}
```

## Dataset Name Sanitization

Dataset names are automatically sanitized for folder naming:
- Convert to lowercase
- Replace spaces with underscores
- Remove special characters
- Remove multiple consecutive underscores

Examples:
- "My Dataset" → "my_dataset"
- "Company Data 2024" → "company_data_2024"
- "Test@#$%Data" → "testdata"

## Session Management

The workflow uses sessionStorage to maintain data between pages:
- `processedData`: Uploaded and processed file data
- `metadata`: Collected metadata information
- `openGinData`: Generated OpenGIN format data
- `datasetName`: User-provided dataset name

## Navigation Flow

```
Home → Upload → Metadata → Review → Download
  ↑                              ↓
  ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

## Error Handling

- **File Validation**: Size limits, format checking
- **Form Validation**: Required fields, URL validation
- **Data Persistence**: Session storage with error recovery
- **Navigation Guards**: Prevent access without required data

## Features

### File Upload
- Drag & drop interface
- File type validation
- Size limits (10MB)
- Real-time preview

### Metadata Collection
- Comprehensive form
- Dynamic URL fields
- Form validation
- Auto-fill defaults

### Data Review
- Complete data preview
- Metadata summary
- File structure preview
- Edit capabilities

### Download Generation
- ZIP file creation
- Folder structure
- File naming
- Download statistics

## Usage

1. **Start**: Navigate to home page and click "Start Data Upload Workflow"
2. **Upload**: Upload your CSV or JSON file
3. **Metadata**: Fill out the metadata form
4. **Review**: Review all information and generate files
5. **Download**: Download the ZIP file with your OpenGIN format files

## Technical Implementation

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **File Processing**: Custom OpenGIN processor
- **ZIP Generation**: JSZip library
- **State Management**: SessionStorage
- **Type Safety**: TypeScript throughout
