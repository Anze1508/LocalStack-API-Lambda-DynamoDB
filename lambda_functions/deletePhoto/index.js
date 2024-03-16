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
