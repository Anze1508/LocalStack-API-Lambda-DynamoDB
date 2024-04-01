# Creating a Serverless Photo Album

This project will be a simple serverless photo album application. Users can upload photos, view a list of uploaded photos, and delete photos.

We will use:

1. API Gateway: Serves as the entry point for the frontend, directing HTTP requests to the appropriate Lambda functions.
2. Lambda Functions: Handle business logic, including listing photos, uploading new photos to S3, and deleting photos.
3. DynamoDB: Stores metadata about each photo, such as filenames, descriptions, and timestamps.
4. S3: to store photos.


## Prerequisites

- LocalStack installed and running with services: API Gateway, Lambda, S3, and DynamoDB.
- AWS CLI and AWS SAM CLI installed and configured to use LocalStack. (https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js and npm installed (for Lambda functions written in JavaScript).
- Postman or a similar tool to test the API endpoints.

## Step 1: Create a table PhotoMetadata for storing photo metadata:

```
awslocal dynamodb create-table \
    --table-name PhotoMetadata \
    --attribute-definitions AttributeName=photoId,AttributeType=S \
    --key-schema AttributeName=photoId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

## Step 2: Create an s3 bucket photo-album-storage:

```
awslocal s3 mb s3://photo-album-storage
```

## Step 3: Develop Lambda Functions

### Create Lambda functions for uploading photos, listing photos, and deleting photos. Use the AWS Lambda and S3 SDKs to interact with S3 and DynamoDB.

1. Install AWS SDK. Create three folders and each one has a Lambda function. Navigate to each function's folder in the terminal.
2. Initialize a new npm project and install the AWS SDK:

```
npm init -y
npm install aws-sdk
```

### Writing the Lambda Functions

uploadPhoto (lambda_functions/uploadPhoto/index.js)

This Lambda function simulates uploading a photo's metadata to DynamoDB. The actual upload process to S3 would typically happen from a client application directly to S3 for efficiency and then trigger this Lambda to store metadata.

```
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://localstack:4566' });

exports.handler = async (event) => {
    // When invoked via API Gateway, the event body is a JSON string
    const body = JSON.parse(event.body);
    const photoId = body.photoId;
    const description = body.description;

    const params = {
        TableName: "PhotoMetadata",
        Item: {
            photoId: photoId,
            description: description,
            // Add any other metadata you need
        },
    };

    try {
        await dynamoDB.put(params).promise();
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Photo uploaded successfully" })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Failed to upload photo", error: error.toString() })
        };
    }
};

```

listPhotos (lambda_functions/listPhotos/index.js)
This function fetches the list of photo metadata from DynamoDB.

```
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://localstack:4566' });

exports.handler = async () => {
    const params = {
        TableName: "PhotoMetadata",
    };

    try {
        const data = await dynamoDB.scan(params).promise();
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photos: data.Items })
        };
    } catch (error) {
        console.error("Error listing photos:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Failed to list photos", error: error.toString() })
        };
    }
};

```
deletePhoto (lambda_functions/deletePhoto/index.js)
This function deletes a photo's metadata from DynamoDB based on photoId.

```
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://localstack:4566' });

exports.handler = async (event) => {
    // Assuming the photoId to delete is passed as a path parameter
    const body = JSON.parse(event.body);
    const photoId = body.photoId;

    const params = {
        TableName: "PhotoMetadata",
        Key: {
            photoId: photoId,
        },
    };

    try {
        await dynamoDB.delete(params).promise();
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Photo deleted successfully" })
        };
    } catch (error) {
        console.error("Error deleting photo:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Failed to delete photo", error: error.toString() })
        };
    }
};

```

### Package and deploy Lambda functions

1. Zip your Lambda functions. Navigate to each of your Lambda function directories (uploadPhoto, listPhotos, deletePhoto) and run:

```
zip -r function.zip .
```

2. Deploy each function to LocalStack using awslocal. Here's how you'd do it for the uploadPhoto function:

```
awslocal lambda create-function --function-name uploadPhoto \
  --zip-file fileb://function.zip \
  --handler index.handler \
  --runtime nodejs12.x \
  --role arn:aws:iam::000000000000:role/irrelevant
```

Repeat the process for listPhotos and deletePhoto, adjusting the --function-name and --zip-file parameters accordingly.

### Test Lambda functions

After deploying your functions, you can invoke them directly using awslocal. This simulates how they would run in an AWS environment. Here's how you can invoke the uploadPhoto Lambda function with a sample payload:

```
echo '{"photoId": "123", "description": "Test Photo"}' | awslocal lambda invoke \
  --function-name uploadPhoto \
  --payload file:///dev/stdin out.txt
```

## Step 4: API Gateway

Integrating your Lambda functions with API Gateway in LocalStack allows you to create a RESTful API that can be accessed over HTTP. This setup lets you invoke your Lambda functions via standard HTTP requests, mimicking a real-world AWS environment but locally. After integrating with API Gateway, we'll test the entire setup to ensure everything works as expected. 

### Create an API Gateway REST API

1. Create a REST API endpoint with API Gateway that will serve as the front door for the Lambda functions.

Create the REST API:
```
awslocal apigateway create-rest-api --name 'PhotoAlbumAPI'
```
This command returns an API ID. Note down this API ID as you'll need it for subsequent steps.

2. Get the Root Resource ID:
```
awslocal apigateway get-resources --rest-api-id <api-id>
```

### Create Resources for Each Function

For each Lambda function, you'll create a corresponding resource in your API Gateway.

1. Create a Resource for Upload:
```
awslocal apigateway create-resource --rest-api-id <api-id> --parent-id <root-id> --path-part uploadPhoto
```
Replace <api-id> with your API ID and <root-id> with the root resource ID. Note down the resource ID returned for the uploadPhoto resource.

2. Repeat this step to create resources for listPhotos and deletePhoto, replacing the --path-part value accordingly.

### Integrate Lambda Functions with API Gateway

Create a POST method for each resource that integrates with the corresponding Lambda function. Here, we'll show how to do it for the uploadPhoto function.

1. Create a POST Method for Upload:

```
awslocal apigateway put-method --rest-api-id <api-id> --resource-id <resource-id> --http-method POST --authorization-type NONE

```

Replace <api-id> with your API ID and <resource-id> with the uploadPhoto resource ID.


2. Set the integration:
```
awslocal apigateway put-integration --rest-api-id <api-id> --resource-id <resource-id> --http-method POST --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:000000000000:function:uploadPhoto/invocations
```

Modify <api-id> and <resource-id> as before. The --uri needs to be adjusted with the correct region and function name. LocalStack uses mock ARNs, so ensure the function name matches what you’ve deployed.

3. Grant Invocation Rights:
```
awslocal lambda add-permission --function-name uploadPhoto --statement-id apigateway-test --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn arn:aws:execute-api:us-east-1:123456789012:<api-id>/*/POST/uploadPhoto
```

Adjust the ARN with your actual API ID and correct the region and account ID as needed. LocalStack doesn't strictly enforce these, but consistency helps avoid confusion.

Do the same to attach a GET Method for listPhoto and DELETE Method for deletePhoto.

### Deploy the API

After setting up the methods and integrations, deploy your API to make it accessible:
```
awslocal apigateway create-deployment --rest-api-id <api-id> --stage-name dev
```

### Testing the API

The API should now be accessible at http://localhost:4566/restapis/<api-id>/dev/_user_request_/uploadPhoto, where <api-id> is replaced with your actual API ID. Use tools like curl or Postman to test the endpoints:

To Upload a Photo Metadata (using curl):
```
curl -X POST "http://localhost:4566/restapis/cswlq19eof/dev/_user_request_/uploadPhoto" -H "Content-Type: application/json" -d '{"photoId": "123", "description"
: "test Photo"}'
```

Test listPhoto:
```
curl -X GET "http://localhost:4566/restapis/cswlq19eof/dev/_user_request_/listPhoto"
```

# End of project. Final thoughts

## Review of the Project. 

The project now includes: 

- DynamoDB Table: For storing photo metadata.
- Lambda Functions: For uploading (uploadPhoto), listing (listPhoto), and deleting (deletePhoto) photo metadata.
- API Gateway: To expose your Lambda functions as HTTP endpoints, making your application accessible via standard web requests.

### Ideas for future enhacements:

1. Frontend Development: To make our application more user-friendly, integrating a frontend using frameworks like React or Vue would be the next step.
2. Authentication and Authorization: Implementing user authentication to secure the application and manage user-specific photo albums.
3. Advanced Features: Exploring advanced AWS services such as S3 for direct photo storage, Cognito for user management, and CloudFront for content delivery.

_I created the backend for a serverless photo album application. This project helped me understand AWS services and serverless architecture. I learned a lot about creating and deploying a cloud-native application._
