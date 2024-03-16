const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient({ endpoint: 'http://localhost:4566' });

exports.handler = async () => {
    const params = {
        TableName: "PhotoMetadata",
    };

    try {
        const data = await dynamoDB.scan(params).promise();
        return { statusCode: 200, body: JSON.stringify(data.Items) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ message: "Failed to list photos" }) };
    }
};
