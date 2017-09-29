const assert = require('assert');
const console = require('console');
const { MESSAGE_TYPE } = require('./lib/message');
const { STATUS: TASK_STATUS } = require('./lib/task');
const { start: startOrchestrator } = require('./lib/orchestrator');
const { start: startWorker } = require('./lib/worker');

function promisify(awsClientFn) {
  return (...args) => awsClientFn(...args).promise();
}

function sqsQueueClient(sqsClient) {
  return {
    deleteMessage: promisify(sqsClient.deleteMessage.bind(sqsClient)),
    receiveMessage: promisify(sqsClient.receiveMessage.bind(sqsClient)),
    sendMessage: promisify(sqsClient.sendMessage.bind(sqsClient)),
  };
}

function dynamoTableClient(documentClient) {
  return {
    get: promisify(documentClient.get.bind(documentClient)),
    query: promisify(documentClient.query.bind(documentClient)),
    put: promisify(documentClient.put.bind(documentClient)),
    update: promisify(documentClient.update.bind(documentClient)),
  };
}

function loggerOrDefault(logger) {
  const { log } = logger || {};
  return typeof log === 'function' ? logger : console;
}

function orchestrator({
  inboundQueue,
  logger,
  queueClient,
  stateTable,
  tableClient,
  workQueue,
}) {
  assert(typeof inboundQueue === 'string', 'inboundQueue must be the URL of an SQS queue');
  assert(typeof stateTable === 'string', 'stateTable must be the name of a DynamoDB table');
  assert(typeof workQueue === 'string', 'workQueue must be the URL of an SQS queue');
  return startOrchestrator({
    inboundQueue,
    logger: loggerOrDefault(logger),
    queueClient,
    stateTable,
    tableClient,
    workQueue,
  });
}

function worker({
  commands, inboundQueue, logger, queueClient,
}) {
  assert(typeof inboundQueue === 'string', 'inboundQueue must be the URL of an SQS queue');
  assert(typeof commands === 'object' && commands !== null, 'commands must be an object mapping command names to implementations');
  return startWorker({
    commands, inboundQueue, logger: loggerOrDefault(logger), queueClient,
  });
}

module.exports = {
  sqsQueueClient,
  dynamoTableClient,
  orchestrator,
  worker,
  MESSAGE_TYPE,
  TASK_STATUS,
};
