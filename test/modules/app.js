const AWS = require('aws-sdk');

exports.config = AWS.config;

exports.lambdaHandler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(event),
  };
};
