const serverless = require('serverless-http');
const app = require('../../server/src/app');

// Wrap Express app with serverless-http
const serverlessHandler = serverless(app);

exports.handler = async (event, context) => {
  // Prevent function timeout from open connection pool handles
  context.callbackWaitsForEmptyEventLoop = false;
  return await serverlessHandler(event, context);
};
