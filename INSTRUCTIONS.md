# Project Instructions

## AWS Deployment Plan

### Phase 1: Frontend
1. Create a webapp using Vite + React TypeScript.
2. The WebApp able to perform Quiz Test using single/multiple choice questions.
3. Questions will be fetched from backend APIs.


### Phase 2: Backend API
1. Create a Lambda function (Node.js for fetching questions).
2. Connect the Lambda function to API Gateway.
3. Test the API endpoint in the browser or using Postman.

### Phase 3: Connect Frontend + Backend
1. Update the frontend JavaScript to call the API Gateway endpoint.
   - Example: `fetch('https://xyz123.execute-api.../hello')`

### Phase 4: Add Database (Optional)
1. Add a DynamoDB table.
2. Update the Lambda function to read/write data to the DynamoDB table.

### Phase 5: Improve & Scale
1. Add CloudFront for HTTPS.
2. Add Route 53 for a custom domain.
3. Add Cognito for authentication if needed.


### Phase 6: Admin Panel 
1. Add questions to Db
2. Update/Delete Questions from Db.

---

## General Notes
- Test each phase thoroughly before moving to the next.
- Refer to AWS documentation for detailed steps on each service.
- Use AWS CloudWatch to monitor and debug your Lambda functions and API Gateway.
- Optimize costs by reviewing AWS billing and usage reports regularly.