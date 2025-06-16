#!/usr/bin/env bun

import { execSync } from 'child_process';

// Debug configuration
const DEBUG_CONFIG = {
  serveUrl: 'https://remotionlambda-uswest2-ncn9mbzk6t.s3.us-west-2.amazonaws.com/sites/viralcut-demo/index.html',
  composition: 'VideoSpeedAdjust',
  props: {
    videoUrl: 'https://viralcut-s3bucket.s3.us-west-2.amazonaws.com/uploads%2F1749454504863-ikkpy1mr-ivatar_code_overview.mp4',
    speedMultiplier: 0.5,
  },
  logLevel: 'verbose' as const,
};

// Build the command
const propsJson = JSON.stringify(DEBUG_CONFIG.props);
const command = [
  'pnpm with-env remotion lambda render',
  DEBUG_CONFIG.serveUrl,
  DEBUG_CONFIG.composition,
  `--props='${propsJson}'`,
  `--log=${DEBUG_CONFIG.logLevel}`,
  '--timeoutInMilliseconds=6000000',
].join(' ');

console.log('🔍 Running debug render with configuration:');
console.log('📍 Serve URL:', DEBUG_CONFIG.serveUrl);
console.log('🎬 Composition:', DEBUG_CONFIG.composition);
console.log('⚙️  Props:', DEBUG_CONFIG.props);
console.log('📝 Log Level:', DEBUG_CONFIG.logLevel);
console.log('');
console.log('🚀 Executing command:');
console.log(command);
console.log('');

try {
  execSync(command, { 
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✅ Debug render completed successfully!');
} catch (error) {
  console.error('❌ Debug render failed:', error);
  process.exit(1);
} 