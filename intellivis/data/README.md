# Sample Data Files

This folder contains sample data files for testing the OpenGIN Tabular format conversion functionality.

## Input Files

### sample-data.json
- **Format**: JSON (JavaScript Object Notation)
- **Content**: Employee data with 5 records
- **Fields**: id, name, email, age, city, department
- **Use case**: Testing JSON file processing and OpenGIN conversion

### sample-data.csv
- **Format**: CSV (Comma-Separated Values)
- **Content**: Same employee data as JSON file
- **Fields**: name, email, age, city, department
- **Use case**: Testing CSV file processing and OpenGIN conversion

### sample-data-json-format.json
- **Format**: JSON with columns/rows structure
- **Content**: Same employee data in OpenGIN-compatible JSON format
- **Structure**: Contains columns array and rows array
- **Use case**: Testing JSON file processing with columns/rows structure

## Output Files

### sample-opengin-format.json
- **Format**: OpenGIN Tabular Format (JSON)
- **Content**: Converted employee data in OpenGIN format
- **Structure**: Contains dataset metadata and tabular data with field, value, type columns
- **Use case**: Example of the expected OpenGIN output format

## Data Structure

Both files contain the same employee information:

| Name | Email | Age | City | Department |
|------|-------|-----|------|------------|
| John Doe | john.doe@example.com | 30 | New York | Engineering |
| Jane Smith | jane.smith@example.com | 28 | San Francisco | Marketing |
| Bob Johnson | bob.johnson@example.com | 35 | Chicago | Sales |
| Alice Brown | alice.brown@example.com | 32 | Seattle | Engineering |
| Charlie Wilson | charlie.wilson@example.com | 29 | Boston | HR |

## Testing the Upload Feature

1. Start the development server: `npm run dev`
2. Open the application in your browser
3. Drag and drop either file onto the upload area
4. Observe the file processing and data preview
5. Test the download functionality for different formats

## OpenGIN Tabular Format

The OpenGIN Tabular format is a standardized way to represent tabular data with the following structure:

```json
{
  "datasetName": "string",
  "metadata": {
    "dataSource": "string",
    "dateOfCreation": "YYYY-MM-DD",
    "dataEntryPerson": "string",
    "importantUrls": ["string"],
    "description": "string"
  },
  "columns": ["column1", "column2", "column3"],
  "rows": [
    ["value1", "value2", "value3"],
    ["value4", "value5", "value6"]
  ]
}
```

## File Formats Supported

The application supports these input file types:
- **JSON** (.json) - Structured data format
- **CSV** (.csv) - Tabular data format

Output format:
- **OpenGIN Tabular** (.json) - Standardized tabular format with metadata

## Notes

- Files are processed client-side for immediate feedback
- Data is validated and parsed automatically
- Export options are available for processed data
- File size limit: 10MB maximum
