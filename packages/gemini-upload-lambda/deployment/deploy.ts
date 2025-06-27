#!/usr/bin/env bun
import { execSync } from "child_process";
import * as fs from "fs";
import {
  CreateFunctionCommand,
  CreateFunctionUrlConfigCommand,
  GetFunctionCommand,
  GetFunctionUrlConfigCommand,
  LambdaClient,
  UpdateFunctionCodeCommand,
} from "@aws-sdk/client-lambda";

// Configuration
const CONFIG = {
  region: process.env.AWS_REGION || "us-west-2",
  functionName: "gemini-upload-handler",
  zipFile: "gemini-upload-lambda.zip",
  runtime: "nodejs20.x" as const,
  handler: "dist/handler.handler",
  timeout: 300, // 5 minutes for large file processing
  memorySize: 1024, // 1GB for file buffering
} as const;

// AWS clients
const lambdaClient = new LambdaClient({ region: CONFIG.region });

async function main() {
  console.log("🚀 Starting Gemini Upload Lambda deployment...");

  try {
    // Step 1: Build and package
    await buildAndPackage();

    // Step 2: Create/update Lambda function
    const lambdaArn = await deployLambdaFunction();

    // Step 3: Create Function URL
    const functionUrl = await createFunctionUrl();

    console.log("✅ Deployment completed successfully!");
    console.log(`📍 Lambda ARN: ${lambdaArn}`);
    console.log(`🌐 Function URL: ${functionUrl}`);
    console.log(`🔗 Direct endpoint for all operations: ${functionUrl}`);
    console.log(``);
    console.log(`Usage examples:`);
    console.log(
      `  POST ${functionUrl} (with path in request body: {"path": "/initiate-upload", ...})`,
    );
    console.log(`  Or use query param: ${functionUrl}?action=initiate-upload`);
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

/**
 * Build TypeScript and create deployment package
 */
async function buildAndPackage(): Promise<void> {
  console.log("📦 Building and packaging Lambda...");

  // Clean previous builds
  if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true });
  }
  if (fs.existsSync(CONFIG.zipFile)) {
    fs.unlinkSync(CONFIG.zipFile);
  }

  // Build TypeScript
  console.log("🔨 Compiling TypeScript...");
  try {
    execSync("pnpm run build", { stdio: "inherit" });
  } catch (error) {
    throw new Error("TypeScript compilation failed");
  }

  // Install production dependencies in temp directory
  console.log("📥 Installing production dependencies...");
  try {
    execSync("npm install --production --no-package-lock", {
      stdio: "inherit",
    });
  } catch (error) {
    console.warn("⚠️  Production install warning (continuing anyway)");
  }

  // Create deployment package
  console.log("📦 Creating deployment package...");
  try {
    execSync(`zip -r ${CONFIG.zipFile} dist/ node_modules/ package.json`, {
      stdio: "inherit",
    });
  } catch (error) {
    throw new Error("Failed to create deployment package");
  }

  const stats = fs.statSync(CONFIG.zipFile);
  console.log(
    `✅ Package created: ${CONFIG.zipFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
  );
}

/**
 * Create or update Lambda function
 */
async function deployLambdaFunction(): Promise<string> {
  console.log("⚡ Deploying Lambda function...");

  const zipBuffer = fs.readFileSync(CONFIG.zipFile);

  try {
    // Try to get existing function
    await lambdaClient.send(
      new GetFunctionCommand({
        FunctionName: CONFIG.functionName,
      }),
    );

    console.log("🔄 Updating existing Lambda function...");
    await lambdaClient.send(
      new UpdateFunctionCodeCommand({
        FunctionName: CONFIG.functionName,
        ZipFile: zipBuffer,
      }),
    );
  } catch (error) {
    // Function doesn't exist, create it
    console.log("🆕 Creating new Lambda function...");
    await lambdaClient.send(
      new CreateFunctionCommand({
        FunctionName: CONFIG.functionName,
        Runtime: CONFIG.runtime,
        Role: await getLambdaExecutionRole(),
        Handler: CONFIG.handler,
        Code: { ZipFile: zipBuffer },
        Timeout: CONFIG.timeout,
        MemorySize: CONFIG.memorySize,
        Environment: {
          Variables: {
            NODE_ENV: "production",
            GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
          },
        },
      }),
    );
  }

  // Get function ARN
  const functionInfo = await lambdaClient.send(
    new GetFunctionCommand({
      FunctionName: CONFIG.functionName,
    }),
  );

  const functionArn = functionInfo.Configuration?.FunctionArn;
  if (!functionArn) {
    throw new Error("Failed to get Lambda function ARN");
  }

  console.log(`✅ Lambda function deployed: ${functionArn}`);
  return functionArn;
}

/**
 * Create Function URL for direct Lambda access (no API Gateway needed)
 */
async function createFunctionUrl(): Promise<string> {
  console.log("🔗 Creating Lambda Function URL...");

  try {
    // Try to get existing function URL
    const existingUrl = await lambdaClient.send(
      new GetFunctionUrlConfigCommand({
        FunctionName: CONFIG.functionName,
      }),
    );

    console.log(`♻️  Function URL already exists: ${existingUrl.FunctionUrl}`);
    return existingUrl.FunctionUrl!;
  } catch (error) {
    // Function URL doesn't exist, create it
    console.log("🆕 Creating new Function URL...");
    const urlResponse = await lambdaClient.send(
      new CreateFunctionUrlConfigCommand({
        FunctionName: CONFIG.functionName,
        Config: {
          AuthType: "NONE", // No authentication for simplicity
          Cors: {
            AllowCredentials: false,
            AllowMethods: ["POST", "OPTIONS"],
            AllowOrigins: ["*"],
            AllowHeaders: ["Content-Type", "Authorization"],
            MaxAge: 300,
          },
        },
      }),
    );

    console.log(`✅ Function URL created: ${urlResponse.FunctionUrl}`);
    return urlResponse.FunctionUrl!;
  }
}

/**
 * Get Lambda execution role ARN
 */
async function getLambdaExecutionRole(): Promise<string> {
  // For simplicity, using root user credentials
  // In production, you should create a proper IAM role
  const accountId = process.env.AWS_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("AWS_ACCOUNT_ID environment variable is required");
  }

  return `arn:aws:iam::${accountId}:role/lambda-execution-role`;
}

// Execute deployment
if (require.main === module) {
  main().catch(console.error);
}
