# Triss Sprite Assets

Place Triss sprite sheets here. Each sprite sheet should be a horizontal strip of frames.

## Required Files

| Filename | Frames | Description |
|----------|--------|-------------|
| `triss-idle.png` | 4 | Idle/blinking, curious looking around |
| `triss-typing.png` | 4 | Excited, leaning forward, bouncing |
| `triss-submitted.png` | 5 | Happy clap with flippers |
| `triss-capturing.png` | 4 | Eyes wide, slight wink, camera icon |
| `triss-verifying.png` | 6 | Eyes spinning like loading spinners |
| `triss-verified.png` | 6 | Big smile, flipper wave, celebration |
| `triss-not_verified.png` | 4 | Confused, head tilt, question mark |
| `triss-photo_deleted.png` | 5 | Satisfied nod, sweeping motion |
| `triss-streak.png` | 6 | Party hat, bouncing celebration |

## Specifications

- **Frame dimensions**: 200x200 pixels per frame
- **Format**: PNG with transparency
- **Layout**: Horizontal strip (frames side by side)
- **Example**: `triss-idle.png` with 4 frames = 800x200 pixels total

## Animation Speeds

| State | FPS | Delay Between Cycles |
|-------|-----|---------------------|
| idle | 4 | 3000ms |
| typing | 6 | 0ms (continuous) |
| submitted | 8 | 1500ms |
| capturing | 6 | 500ms |
| verifying | 10 | 0ms (continuous) |
| verified | 8 | 2000ms |
| not_verified | 5 | 2000ms |
| photo_deleted | 6 | 2000ms |
| streak | 8 | 1000ms |
