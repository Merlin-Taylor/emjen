/* eslint-disable */
global.Promise = require('bluebird');

const AWS = require('aws-sdk');
// AWS.config.update({ logger: console, region: 'eu-west-1' });
AWS.config.update({ region: 'eu-west-1' });

const {
  dynamoTableClient,
  MESSAGE_TYPE: { TaskStarted, TaskCompleted },
  orchestrator,
  sqsQueueClient,
  TASK_STATUS: { running, completed },
  worker,
} = require('..');

const jobsTable = 'merlin-test';
const orchestratorQueueUrl = 'https://sqs.eu-west-1.amazonaws.com/886983751479/merlin-test-reply';
const workerQueueUrl = 'https://sqs.eu-west-1.amazonaws.com/886983751479/merlin-test';

const params = startTime => ({
  MessageBody: JSON.stringify({
    Type: 'NewJob',
    Job: {
      JobId: '1',
      Status: 'active',
      Tasks: {
        EchoHello1: {
          Params: { Message: 'Hello' },
          Command: 'start-echo/v1',
          LastModified: startTime,
          Seq: 0,
          Status: 'pending',
          TTL: 10000,
        },
        EchoWorld1: {
          Params: { Message: { $ref: '/EchoHello1/Result' } },
          Command: 'echo/v1',
          LastModified: startTime,
          Seq: 0,
          Status: 'pending',
          TTL: 20000,
        },
        ShouldTimeOut: {
          DependsOn: ['EchoHello1'],
          Command: 'timeout/v1',
          LastModified: startTime,
          Seq: 0,
          Status: 'pending',
          TTL: 20000,
        },
      },
      User: 'merlin'
    },
  }),
  QueueUrl: orchestratorQueueUrl,
});


const commands = {
  'echo/v1': ({ Args: { Message } }, { sendToReplyQueue }) =>
    Promise.delay(1000)
      .then(() => sendToReplyQueue({ Result: Message, Status: completed, Type: TaskCompleted })),
  'start-echo/v1': ({ Args: { Message }, ReplyTo, TTL }, { sendToReplyQueue, sendToWorkQueue }) =>
    Promise.delay(1000)
      .then(() => sendToWorkQueue({
        Args: {
          Interval: 1,
        },
        Command: 'await-echo/v1',
        ReplyTo,
        TTL,
        Type: 'RunTask',
      }))
      .then(() => sendToReplyQueue({ Status: running, Type: TaskStarted })),
  'await-echo/v1': (message, { sendToReplyQueue, sendToWorkQueue }) =>
    // sendToWorkQueue(message, message.Args.Interval),
    sendToReplyQueue({ Result: 'Done', Status: completed, Type: TaskCompleted }),
  'timeout/v1': (message, { sendToReplyQueue, sendToWorkQueue }) => sendToReplyQueue({ Status: running, Type: TaskStarted }),
};

const sqs = new AWS.SQS();
const documentClient = new AWS.DynamoDB.DocumentClient();
function initialise() {
  const purgeQueuesP = Promise.map([orchestratorQueueUrl, workerQueueUrl], QueueUrl => sqs.purgeQueue({ QueueUrl }).promise());
  const cleanJobsDbP = documentClient.delete({ TableName: jobsTable, Key: { JobId: '1' } }).promise();
  return Promise.all([purgeQueuesP, cleanJobsDbP]);
}

const queueClient = sqsQueueClient(sqs);
const tableClient = dynamoTableClient(documentClient);
initialise()
  .then(() => sqs.sendMessage(params(Date.now())).promise())
  .then(x => console.log(x))
  .catch((e) => { console.log(e); return Promise.reject(e); })
  .then(() => Promise.all([
    worker({
      commands,
      inboundQueue: workerQueueUrl,
      queueClient,
    }),
    orchestrator({
      inboundQueue: orchestratorQueueUrl,
      queueClient,
      stateTable: jobsTable,
      tableClient,
      workQueue: workerQueueUrl,
    })]));
