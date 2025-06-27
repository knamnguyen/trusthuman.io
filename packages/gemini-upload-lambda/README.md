# Gemini Upload Lambda

A standalone AWS Lambda function for handling large file uploads to the Gemini Files API. This Lambda bypasses Vercel's 4.5MB request limit by acting as a proxy that buffers 4MB client chunks into 8MB chunks required by Gemini.

## Architecture

```
Browser (4MB chunks) → Lambda Function URL → Lambda (buffers to 8MB) → Gemini Files API
```

## Features

- **Direct Lambda URL**: No API Gateway needed - simpler deployment
- **Chunk Buffering**: Converts 4MB client chunks to 8MB Gemini chunks
- **Session Management**: Tracks upload progress across multiple chunks
- **CORS Support**: Built-in CORS handling with Function URLs
- **Error Handling**: Comprehensive error handling and logging
- **Simple Deployment**: Single Lambda function with Function URL

## API Usage

All requests go to the single Lambda Function URL with different actions:

**Function URL**: `https://abc123defg.lambda-url.us-west-2.on.aws/`

### Initiate Upload

**POST** with query param: `?action=initiate-upload`

**Request:**

```json
{
  "fileName": "video.mp4",
  "mimeType": "video/mp4",
  "fileSize": 52428800
}
```

**Response:**

```json
{
  "sessionId": "gemini-upload-1234567890-abc123",
  "uploadUrl": "lambda-session://gemini-upload-1234567890-abc123"
}
```

### Upload Chunk

**POST** with query param: `?action=upload-chunk`

**Request:**

```json
{
  "sessionId": "gemini-upload-1234567890-abc123",
  "chunkData": "base64-encoded-chunk-data",
  "isLastChunk": false
}
```

**Response:**

```json
{
  "bytesUploaded": 8388608,
  "totalBytes": 52428800,
  "percentage": 16,
  "fileUri": "gs://gemini-files/abc123" // Only on final chunk
}
```

### Finalize Upload

**POST** with query param: `?action=finalize-upload`

**Request:**

```json
{
  "sessionId": "gemini-upload-1234567890-abc123"
}
```

**Response:**

```json
{
  "fileUri": "gs://gemini-files/abc123",
  "mimeType": "video/mp4",
  "name": "video.mp4"
}
```

## Environment Variables

```bash
# Required
GEMINI_API_KEY=your-gemini-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-2
AWS_ACCOUNT_ID=123456789012  # For IAM role creation

# Optional
NODE_ENV=production
```

## Deployment

### 1. Install Dependencies

```bash
cd packages/gemini-upload-lambda
pnpm install
```

### 2. Set Environment Variables

```bash
# Add to your .env file in project root
GEMINI_API_KEY=your-gemini-api-key
AWS_ACCOUNT_ID=123456789012
```

### 3. Deploy to AWS

```bash
pnpm deploy
```

This will:

- Build TypeScript to JavaScript
- Package Lambda with dependencies
- Create/update Lambda function
- Create API Gateway with CORS
- Set up endpoint routing

### 4. Update Frontend Configuration

After deployment, update your frontend to use the new Lambda endpoint:

```typescript
// Replace tRPC endpoint with Lambda endpoint
const GEMINI_UPLOAD_ENDPOINT =
  "https://abc123.execute-api.us-west-2.amazonaws.com/prod";
```

## Development

### Build

```bash
pnpm build
```

### Package for Deployment

```bash
pnpm package
```

### Clean Build Artifacts

```bash
pnpm clean
```

## Integration with Frontend

Replace the existing tRPC gemini upload with direct HTTP calls to the Lambda endpoints:

```typescript
// Before (tRPC - hitting Vercel limits)
const result = await trpc.geminiUpload.uploadChunk.mutate({
  sessionId,
  chunkData,
  isLastChunk,
});

// After (Lambda - no size limits)
const response = await fetch(`${LAMBDA_ENDPOINT}/upload-chunk`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId, chunkData, isLastChunk }),
});
const result = await response.json();
```

## Cost Estimation

**Lambda Costs (us-west-2):**

- Requests: $0.20 per 1M requests
- Duration: $0.0000166667 per GB-second
- Storage: Minimal (code package only)

**API Gateway Costs:**

- $3.50 per million API calls
- Data transfer costs apply

**Example:** 100 video uploads/day (50MB each, 13 chunks per video):

- ~39,000 requests/month
- ~$0.14/month (Lambda + API Gateway)

## Troubleshooting

### Function Not Found Error

Ensure AWS credentials are properly set and the function was deployed successfully.

### CORS Errors

The Lambda includes CORS headers. If you still see CORS errors, check that preflight OPTIONS requests are being handled.

### Timeout Errors

The function is configured with a 5-minute timeout. For very large files, consider increasing this in the deployment configuration.

### Memory Errors

The function uses 1GB memory for file buffering. If you see memory errors, increase the `memorySize` in the deployment config.

## Security Notes

- This implementation uses root AWS credentials for simplicity
- In production, create a dedicated IAM role with minimal permissions
- Consider adding API key authentication to the endpoints
- Monitor CloudWatch logs for any security issues
