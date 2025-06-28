# @sassy/gemini-upload-lambda

AWS Lambda Function URL for handling large video uploads to Gemini Files API via streaming, bypassing Vercel's payload limitations.

## Features

- **Streaming uploads** from browser to Lambda to Gemini (no chunking required)
- Uses Gemini's resumable upload protocol for efficient file transfers
- CORS-enabled for direct frontend integration
- No session management or temporary storage needed
- TypeScript with full type safety

## Updated Architecture (Streaming)

This Lambda function acts as a streaming proxy:

1. **Browser → Lambda**: Sends file via FormData multipart upload
2. **Lambda → Gemini**: Streams file directly using Gemini's resumable upload protocol
3. **No chunking**: Entire file uploaded in single request
4. **No base64 encoding**: Direct binary transfer for efficiency

## Deployment Instructions

### Step 1: Build Package

```bash
cd packages/gemini-upload-lambda
pnpm build
```

### Step 2: Update Existing Lambda Function

Since your Lambda function `gemini-upload-handler` already exists, you need to:

1. **Go to AWS Lambda Console**
2. **Find your function**: `gemini-upload-handler`
3. **Upload new code**:
   - Click "Upload from" → ".zip file"
   - Upload `dist/lambda-deployment.zip`
   - Click "Save"

### Step 3: Update Function Configuration

**Important**: The new implementation uses different endpoints:

- **OLD**: `/initiate`, `/chunk`, `/status`
- **NEW**: `/upload` (single endpoint)

**Update Handler**: Ensure handler is set to `handler.handler`

**Update Environment Variables**: Verify `GEMINI_API_KEY` is set

**Update CORS Configuration**:

- Go to Configuration → Function URL
- Ensure CORS allows:
  - **Origins**: `*` (or `http://localhost:3000` for dev)
  - **Methods**: `POST, OPTIONS`
  - **Headers**: `content-type`

### Step 4: Test New Implementation

```bash
# Test the updated function
pnpm test-upload
```

## Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (required)

## API Endpoint

- `POST /upload` - Stream upload file to Gemini (accepts multipart/form-data)

## Benefits of Streaming Approach

- **No payload size limits** (was hitting 6MB Lambda limit with chunked approach)
- **Simpler frontend code** (no chunking logic)
- **More efficient** (no base64 encoding overhead)
- **Better error handling** (single request vs multiple chunk requests)
- **Cleaner architecture** (stateless, no session management)
