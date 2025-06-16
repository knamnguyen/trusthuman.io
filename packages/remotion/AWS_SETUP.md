# AWS Setup for Remotion Lambda

This document provides step-by-step instructions for setting up AWS IAM permissions required for Remotion Lambda.

## Prerequisites

- AWS Account with access to IAM console
- AWS credentials already added to `.env` file
- **Note**: This setup now uses the unified `viralcut-user` approach from the main AWS_SETUP_GUIDE.md

## Unified Approach (Recommended)

**✅ If you're following the main AWS_SETUP_GUIDE.md:** Your `viralcut-user` already has all the required Remotion permissions. No additional setup needed!

**Resource Names Used:**
- IAM User: `viralcut-user`
- S3 Bucket: `remotionlambda` (auto-created)
- Lambda Function: `remotion-render`
- IAM Role: `remotion-lambda-role` (auto-created)

## Legacy Separate Setup (For Reference Only)

*Note: This approach is deprecated in favor of the unified viralcut-user approach above.*

### Step 1: Create IAM Role Policy

1. Go to [AWS IAM Policies Console](https://console.aws.amazon.com/iam/home#/policies)
2. Click "Create policy"
3. Click the "JSON" tab
4. Copy and paste the following JSON policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "0",
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Sid": "1",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:PutBucketAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl",
        "s3:PutObject",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::remotionlambda-*"
      ]
    },
    {
      "Sid": "2",
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:*:*:function:remotion-render-*"
      ]
    },
    {
      "Sid": "3",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup"
      ],
      "Resource": [
        "arn:aws:logs:*:*:log-group:/aws/lambda-insights"
      ]
    },
    {
      "Sid": "4",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:*:*:log-group:/aws/lambda/remotion-render-*",
        "arn:aws:logs:*:*:log-group:/aws/lambda-insights:*"
      ]
    }
  ]
}
```

5. Click "Next"
6. Name the policy **exactly**: `remotion-lambda-policy`
7. Click "Create policy"

### Step 2: Create IAM Role

1. Go to [AWS IAM Roles Console](https://console.aws.amazon.com/iam/home#/roles)
2. Click "Create role"
3. Under "Use cases", select "Lambda"
4. Click "Next"
5. Under "Permissions policies", search for `remotion-lambda-policy` and check the box
6. Click "Next"
7. Name the role **exactly**: `remotion-lambda-role`
8. Click "Create role"

### Step 3: Update User Permissions (Legacy)

*Note: Skip this if using the unified viralcut-user approach*

1. Go to [AWS IAM Users Console](https://console.aws.amazon.com/iam/home#/users)
2. Click on your Remotion user (the one whose credentials you're using)
3. Go to the "Permissions" tab
4. Click "Add inline policy" (under "Add permissions" dropdown)
5. Click the "JSON" tab
6. Copy and paste the following JSON policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "HandleQuotas",
      "Effect": "Allow",
      "Action": [
        "servicequotas:GetServiceQuota",
        "servicequotas:GetAWSDefaultServiceQuota",
        "servicequotas:RequestServiceQuotaIncrease",
        "servicequotas:ListRequestedServiceQuotaChangeHistoryByQuota"
      ],
      "Resource": ["*"]
    },
    {
      "Sid": "PermissionValidation",
      "Effect": "Allow",
      "Action": ["iam:SimulatePrincipalPolicy"],
      "Resource": ["*"]
    },
    {
      "Sid": "LambdaInvokation",
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": ["arn:aws:iam::*:role/remotion-lambda-role"]
    },
    {
      "Sid": "Storage",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl",
        "s3:PutObject",
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:PutBucketAcl",
        "s3:DeleteBucket",
        "s3:PutBucketOwnershipControls",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutLifecycleConfiguration"
      ],
      "Resource": ["arn:aws:s3:::remotionlambda"]
    },
    {
      "Sid": "BucketListing",
      "Effect": "Allow",
      "Action": ["s3:ListAllMyBuckets"],
      "Resource": ["*"]
    },
    {
      "Sid": "FunctionListing",
      "Effect": "Allow",
      "Action": ["lambda:ListFunctions", "lambda:GetFunction"],
      "Resource": ["*"]
    },
    {
      "Sid": "FunctionManagement",
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeAsync",
        "lambda:InvokeFunction",
        "lambda:CreateFunction",
        "lambda:DeleteFunction",
        "lambda:PutFunctionEventInvokeConfig",
        "lambda:PutRuntimeManagementConfig",
        "lambda:TagResource"
      ],
      "Resource": ["arn:aws:lambda:*:*:function:remotion-render"]
    },
    {
      "Sid": "LogsRetention",
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:PutRetentionPolicy"],
      "Resource": ["arn:aws:logs:*:*:log-group:/aws/lambda/remotion-render"]
    },
    {
      "Sid": "FetchBinaries",
      "Effect": "Allow",
      "Action": ["lambda:GetLayerVersion"],
      "Resource": [
        "arn:aws:lambda:*:678892195805:layer:remotion-binaries-*",
        "arn:aws:lambda:*:580247275435:layer:LambdaInsightsExtension*"
      ]
    }
  ]
}
```

7. Click "Next"
8. Name the policy: `remotion-user-policy` (or any name you prefer)
9. Click "Create policy"

## Validation & Deployment

### Step 4: Validate Permissions

Run this command to validate your permissions setup:

```bash
cd packages/remotion
pnpm with-env remotion lambda policies validate
```

### Step 5: Deploy Remotion Infrastructure

After completing the IAM setup, deploy the Lambda function and site with viralcut-specific naming:

```bash
# Deploy Lambda function (will create remotion-render)
cd packages/remotion
pnpm remotion:functions:deploy

# Deploy Remotion site (will create viralcut-demo site)
pnpm remotion:sites:create
```

## Environment Variables

Make sure your `.env` file contains:

```env
# Use the same viralcut-user credentials
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIA... # Your viralcut-user credentials
AWS_SECRET_ACCESS_KEY=... # Your viralcut-user credentials

# Optional: Override default function name
REMOTION_LAMBDA_FUNCTION_NAME=remotion-render
```

## Troubleshooting

- If you get permission errors, double-check that:

  - You're using the unified `viralcut-user` approach from the main AWS guide
  - AWS credentials in `.env` are correct for viralcut-user
  - The `viralcut-user` has the combined policy with all Remotion permissions

- **Migration from old setup:** If you previously used separate `remotion-user`, you can safely delete it after confirming `viralcut-user` works

- For additional help, see [Remotion Lambda Permissions Guide](https://www.remotion.dev/docs/lambda/permissions)
