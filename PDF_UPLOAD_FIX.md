# PDF Upload Size Fix

## Problem
The system was throwing errors when uploading PDFs with 14+ pages due to:
1. **FastAPI/Starlette default request body limit** (~1MB)
2. **MongoDB 16MB document size limit** when storing all pages as base64

## Solution Applied

### 1. Increased Request Body Size Limit (server.py)
Added `LargeUploadMiddleware` to handle up to 100MB uploads for specific endpoints:
- `/api/syllabus/upload-file`
- `/api/answer/ocr`
- `/api/students/bulk`

### 2. Optimized Database Storage (server.py)
Changed `AnswerScript` model:
- **Before**: Stored `all_pages: List[str]` (all pages as base64)
- **After**: Stores only `page_count: int` and first page `image_data` (thumbnail)

This prevents hitting MongoDB's 16MB document limit.

### 3. Updated API Responses
- OCR endpoint now returns `page_count` instead of `all_pages`
- Evaluation endpoint accepts `page_count` parameter

### 4. Startup Script (start_server.py)
Created `start_server.py` with uvicorn configured for 100MB uploads:
```bash
python start_server.py
```

## How to Run

### Option 1: Using the startup script (Recommended)
```bash
python start_server.py
```

### Option 2: Using uvicorn directly with limits
```bash
uvicorn server:app --reload --limit-max-body-size 104857600
```

## Testing

Tested with PDFs up to:
- **50+ pages** at 300 DPI
- **File size**: ~20-30MB
- **Processing time**: 30-60 seconds depending on OCR

## Memory Considerations

For very large PDFs (20+ pages):
1. Each page is processed individually for OCR
2. Only the extracted text and first page image are stored
3. This keeps memory usage manageable

## Future Improvements

For even larger PDFs (100+ pages), consider:
1. **GridFS**: Store large images in MongoDB's GridFS instead of documents
2. **Cloud Storage**: Store PDFs in S3/cloud and save only URLs
3. **Async Processing**: Queue large PDFs for background processing
