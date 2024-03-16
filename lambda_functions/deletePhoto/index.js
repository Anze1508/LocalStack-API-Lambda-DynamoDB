const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://localhost:4566' });

exports.handler = async (event) => {
    const photoId = event.photoId; // Assume photoId is passed in the event

    const params = {
        TableName: "PhotoMetadata",
        Key: {
            photoId: photoId,
        },
    };

    try {
        await dynamoDB.delete(params).promise();
        return { statusCode: 200, body: JSON.stringify({ message: "Photo deleted successfully" }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ message: "Failed to delete photo" }) };
    }
};
