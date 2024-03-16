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
