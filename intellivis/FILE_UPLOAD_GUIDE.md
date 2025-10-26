# File Upload Guide

This application now supports accepting and processing various data files. Here's how to use the functionality:

## Supported File Types

- **JSON** (.json) - JavaScript Object Notation files
- **CSV** (.csv) - Comma-separated values files  
- **TXT** (.txt) - Plain text files
- **Excel** (.xlsx, .xls) - Microsoft Excel files

## Features

### 1. Drag & Drop Upload
- Drag files directly onto the upload area
- Visual feedback when dragging files over the drop zone
- File validation (size and type checking)

### 2. File Processing
- Automatic file type detection
- Data parsing and validation
- Metadata extraction (file size, row count, columns)
- Error handling for invalid files

### 3. Data Preview
- Display processed data in a readable format
- Show file metadata and statistics
- Column information for structured data

### 4. Export Options
- Download processed data as JSON
- Download processed data as CSV (for structured data)
- Maintain original file structure

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Upload a file** by either:
   - Dragging and dropping a file onto the upload area
   - Clicking "browse files" to select a file

4. **View the results** - the application will:
   - Process your file
   - Display file information and metadata
   - Show a preview of the data
   - Provide download options

## API Endpoints

### POST /api/upload
Upload files to the server (optional server-side processing)

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (File object)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "name": "example.json",
    "size": 1024,
    "type": "application/json",
    "path": "1234567890-example.json",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## File Size Limits

- Maximum file size: 10MB
- Supported formats: .json, .csv, .txt, .xlsx, .xls

## Error Handling

The application handles various error scenarios:

- **File too large**: Shows error message for files exceeding 10MB
- **Invalid file type**: Rejects unsupported file formats
- **Corrupted files**: Displays parsing errors for malformed data
- **Network errors**: Handles upload failures gracefully

## Sample Data

The project includes sample data files for testing in the `data/` folder:
- `data/sample-data.json` - JSON format with employee data
- `data/sample-data.csv` - CSV format with the same data

## Customization

### Adding New File Types

To support additional file types, modify the `FileProcessor` class in `app/utils/fileProcessor.ts`:

1. Add the new file extension to the `processFile` method
2. Create a new processing method for the file type
3. Update the `acceptedTypes` array in the `FileUpload` component

### Modifying File Size Limits

Update the `maxSize` prop in the `FileUpload` component and the API route validation.

### Styling

The components use Tailwind CSS classes and can be customized by modifying the className props in the component files.

## Security Considerations

- File type validation on both client and server
- File size limits to prevent abuse
- Server-side file storage in a dedicated uploads directory
- Input sanitization for processed data

## Troubleshooting

### Common Issues

1. **File not uploading:
   - Check file size (must be under 10MB)
   - Verify file type is supported
   - Ensure browser supports FileReader API

2. **Processing errors:
   - Verify file format is valid
   - Check for special characters in data
   - Ensure proper encoding (UTF-8 recommended)

3. **Download not working:
   - Check browser popup blockers
   - Verify data is in the correct format for download
   - Ensure sufficient browser permissions

For additional help, check the browser console for error messages.
