# Upload Server

A dedicated Hono.js server for handling large video file uploads to Gemini Files API.

## Features

- ✅ **Large file uploads** (up to 2GB)
- ✅ **Direct streaming** to Gemini Files API
- ✅ **Built with Bun** for performance
- ✅ **Docker support** for easy deployment
- ✅ **Health checks** and monitoring
- ✅ **CORS configured** for web clients
- ✅ **Rate limiting** and security headers

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Start development server
pnpm dev
```

### Docker Development

```bash
# Build and run with Docker
docker build -t upload-server .
docker run -p 3001:3001 --env-file .env upload-server
```

### Production Deployment

See [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## API Endpoints

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00Z",
  "uptime": 3600,
  "memory": {...},
  "service": "upload-server",
  "version": "0.1.0"
}
```

### Upload to Gemini

```
POST /upload/gemini
Content-Type: multipart/form-data

Body: file (video file)
```

Response:

```json
{
  "success": true,
  "data": {
    "fileUri": "gs://...",
    "mimeType": "video/mp4",
    "name": "files/abc123",
    "state": "ACTIVE"
  }
}
```

## Environment Variables

| Variable         | Description                          | Required |
| ---------------- | ------------------------------------ | -------- |
| `GEMINI_API_KEY` | Google Gemini API key                | ✅       |
| `NODE_ENV`       | Environment (development/production) | ❌       |
| `PORT`           | Server port (default: 3001)          | ❌       |

## Integration with Main App

Once deployed, update your Next.js app to use the upload server:

```typescript
// In your Next.js app
const uploadToGemini = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://your-upload-server/upload/gemini", {
    method: "POST",
    body: formData,
  });

  return response.json();
};
```

## Performance

- **Concurrent uploads**: Handles multiple uploads simultaneously
- **Memory efficient**: Streams files without loading into memory
- **Fast processing**: Bun runtime for optimal performance
- **Auto-scaling**: Ready for horizontal scaling with load balancers

## Security

- **Rate limiting**: 10 requests per minute per IP
- **File validation**: Only accepts video files
- **CORS protection**: Configured origins only
- **Health monitoring**: Built-in health checks
