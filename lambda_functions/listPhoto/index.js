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
