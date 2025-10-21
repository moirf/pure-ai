# AWS Deployment Plan

## Phase 1: Frontend

1. Sign up for AWS.
2. Upload a simple `index.html` to S3.
3. Enable static website hosting.

## Phase 2: Backend API

1. Create a Lambda function (Node.js hello world).
2. Connect it to API Gateway.
3. Test the API endpoint in the browser.

## Phase 3: Connect Frontend + Backend

1. Update your frontend JavaScript to call the API Gateway endpoint.
   - Example: `fetch('https://xyz123.execute-api.../hello')`

## Phase 4: Add Database (Optional)

1. Add a DynamoDB table.
2. Update the Lambda function to read/write data.

## Phase 5: Improve & Scale

1. Add CloudFront for HTTPS.
2. Add Route 53 for a custom domain.
3. Add Cognito for authentication if needed.