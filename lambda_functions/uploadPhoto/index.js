const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://localhost:4566' });

exports.handler = async (event) => {
    const photoId = event.photoId; // Assume photoId is passed in the event
    const description = event.description; // Assume description is also passed in the event

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
        return { statusCode: 200, body: JSON.stringify({ message: "Photo uploaded successfully" }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ message: "Failed to upload photo" }) };
    }
};
