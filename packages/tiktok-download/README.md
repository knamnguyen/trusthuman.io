# @sassy/tiktok-download

A TypeScript service for downloading TikTok videos using yt-dlp, designed for integration into the monorepo ecosystem.

## Features

- ✨ Download all videos from any TikTok user account
- 📝 Automatically save video descriptions and metadata
- 🎯 Configurable output directory and file naming
- 🔢 Limit maximum number of downloads
- 🚀 Fast execution with proper error handling
- 📦 TypeScript with full type safety using Zod validation
- 🛠️ Service-oriented architecture for easy integration

## Prerequisites

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and available in PATH

### Install yt-dlp

```bash
# macOS with Homebrew
brew install yt-dlp

# Or with Python pip
pip install yt-dlp
```

## Installation

This package is part of the monorepo and uses workspace dependencies.

```bash
pnpm install
```

## Usage

### Service Usage (Programmatic)

```typescript
import { TikTokDownloadService } from "@sassy/tiktok-download";

const service = new TikTokDownloadService();

const result = await service.downloadUserVideos({
  username: "someuser",
  outputDir: "./videos",
  maxVideos: 10,
  writeDescription: true,
  writeInfoJson: true,
});

console.log(`Downloaded ${result.totalDownloaded} videos`);
```

### Test Script Usage

```bash
# Basic download with username
pnpm tiktok-download --username myuser

# Download with username and limit
pnpm tiktok-download --username @myuser --max-videos 5

# Short form flags
pnpm tiktok-download -u myuser -m 3
```

### Available Options

- `--username, -u`: TikTok username (with or without @) - **Required**
- `--max-videos, -m`: Maximum number of videos to download - **Optional**

## Service API

### TikTokDownloadService

#### Constructor
```typescript
constructor(config?: Partial<TikTokDownloadConfig>)
```

#### Methods

- `checkYtDlpAvailable()`: Check if yt-dlp is installed
- `downloadUserVideos(options)`: Download videos from a TikTok user
- `generateUniqueOutputDir(baseDir, username)`: Generate unique output directory

#### Types

```typescript
interface TikTokDownloadOptions {
  username: string;
  outputDir?: string;
  format?: string;
  writeDescription?: boolean;
  writeInfoJson?: boolean;
  maxVideos?: number;
}

interface TikTokDownloadResult {
  username: string;
  totalDownloaded: number;
  outputDir: string;
  success: boolean;
  error?: string;
}
```

## Output Structure

Videos are saved with the following naming pattern:
```
downloads/
├── Video Title Here-1234567890.mp4
├── Video Title Here-1234567890.description
├── Video Title Here-1234567890.info.json
└── ...
```

## Error Handling

The service includes comprehensive error handling:
- Checks if yt-dlp is installed before running
- Validates all input options using Zod schemas
- Provides detailed error messages
- Returns structured results with success/failure status

## Integration

This service is designed to be easily integrated into:
- tRPC API endpoints
- Background job processors
- CLI applications
- Web applications

## Development

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Clean build artifacts
pnpm clean
```

## License

MIT

---

**Note**: This tool is for educational and personal use. Please respect TikTok's terms of service and content creators' rights when downloading videos. 