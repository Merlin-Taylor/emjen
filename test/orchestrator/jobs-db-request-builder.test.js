

const proxyquire = require('proxyquire').noCallThru();
require('should');

const fakes = {
  '../task': { terminalStates: ['TERMINAL-1', 'TERMINAL-2'] },
  '../now': () => 42,
};

const {
  getJobRequest,
  insertJobRequest,
  scanActiveRequest,
  updateJobRequest,
  updateTaskRequest,
} = proxyquire('../../lib/orchestrator/jobs-db-request-builder', fakes);

describe('orchestrator/jobs-db-request-builder', () => {
  describe('getJobRequest', () => {
    it('it returns the expected DynamoDB request', () => getJobRequest({ JobId: 'j1', TableName: 't1' })
      .should.eql({ TableName: 't1', Key: { JobId: 'j1' } }));
  });
  describe('insertJobRequest', () => {
    it('it returns the expected DynamoDB request', () => insertJobRequest({ Job: { JobId: 'j1' }, TableName: 't1' })
      .should.eql({
        TableName: 't1',
        Item: { JobId: 'j1' },
        ConditionExpression: 'attribute_not_exists(JobId)',
      }));
  });
  describe('scanActiveRequest', () => {
    it('it returns the expected DynamoDB request', () => scanActiveRequest({ TableName: 't1' })
      .should.eql({
        TableName: 't1',
        IndexName: 'Status-index',
        KeyConditionExpression: '#Status = :Status',
        ExpressionAttributeNames: {
          '#Status': 'Status',
        },
        ExpressionAttributeValues: {
          ':Status': 'active',
        },
      }));
  });
  describe('updateJobRequest', () => {
    it('it returns the expected DynamoDB request', () => updateJobRequest({ JobId: 'j1', Status: 's1', TableName: 't1' })
      .should.eql({
        TableName: 't1',
        Key: { JobId: 'j1' },
        UpdateExpression: 'SET #Status = :Status',
        ConditionExpression: 'not #Status in (:TERMINAL-1, :TERMINAL-2)',
        ExpressionAttributeNames: { '#Status': 'Status' },
        ExpressionAttributeValues: {
          ':Status': 's1',
          ':TERMINAL-1': 'TERMINAL-1',
          ':TERMINAL-2': 'TERMINAL-2',
        },
      }));
  });
  describe('updateTaskRequest', () => {
    context('when neither a QueuedTimestamp nor a Result is specified', () => {
      it('it returns the expected DynamoDB request', () => updateTaskRequest({
        JobId: 'my-job',
        TaskId: 'my-task',
        Seq: 7,
        Status: 'my-status',
        TableName: 'my-table',
      })
        .should.eql({
          TableName: 'my-table',
          Key: { JobId: 'my-job' },
          UpdateExpression: 'SET #Tasks.#TaskId.#LastModified = :LastModified, #Tasks.#TaskId.#Seq = :Seq, #Tasks.#TaskId.#Status = :Status',
          ConditionExpression: '#Tasks.#TaskId.#Seq < :Seq and not #Tasks.#TaskId.#Status in (:TERMINAL-1, :TERMINAL-2)',
          ExpressionAttributeNames: {
            '#LastModified': 'LastModified',
            '#Seq': 'Seq',
            '#Status': 'Status',
            '#TaskId': 'my-task',
            '#Tasks': 'Tasks',
          },
          ExpressionAttributeValues: {
            ':LastModified': 42,
            ':Seq': 7,
            ':Status': 'my-status',
            ':TERMINAL-1': 'TERMINAL-1',
            ':TERMINAL-2': 'TERMINAL-2',
          },
        }));
    });
    context('when a QueuedTimestamp is specified', () => {
      it('it returns the expected DynamoDB request', () => updateTaskRequest({
        JobId: 'my-job',
        TaskId: 'my-task',
        QueuedTimestamp: 41,
        Seq: 7,
        Status: 'my-status',
        TableName: 'my-table',
      })
        .should.eql({
          TableName: 'my-table',
          Key: { JobId: 'my-job' },
          UpdateExpression: 'SET #Tasks.#TaskId.#LastModified = :LastModified, #Tasks.#TaskId.#Seq = :Seq, #Tasks.#TaskId.#Status = :Status, #Tasks.#TaskId.#QueuedTimestamp = :QueuedTimestamp',
          ConditionExpression: '#Tasks.#TaskId.#Seq < :Seq and not #Tasks.#TaskId.#Status in (:TERMINAL-1, :TERMINAL-2)',
          ExpressionAttributeNames: {
            '#LastModified': 'LastModified',
            '#QueuedTimestamp': 'QueuedTimestamp',
            '#Seq': 'Seq',
            '#Status': 'Status',
            '#TaskId': 'my-task',
            '#Tasks': 'Tasks',
          },
          ExpressionAttributeValues: {
            ':LastModified': 42,
            ':QueuedTimestamp': 41,
            ':Seq': 7,
            ':Status': 'my-status',
            ':TERMINAL-1': 'TERMINAL-1',
            ':TERMINAL-2': 'TERMINAL-2',
          },
        }));
    });
  });
  context('when a Result is specified', () => {
    it('it returns the expected DynamoDB request', () => updateTaskRequest({
      JobId: 'my-job',
      TaskId: 'my-task',
      Result: { hello: 'world' },
      Seq: 7,
      Status: 'my-status',
      TableName: 'my-table',
    })
      .should.eql({
        TableName: 'my-table',
        Key: { JobId: 'my-job' },
        UpdateExpression: 'SET #Tasks.#TaskId.#LastModified = :LastModified, #Tasks.#TaskId.#Seq = :Seq, #Tasks.#TaskId.#Status = :Status, #Tasks.#TaskId.#Result = :Result',
        ConditionExpression: '#Tasks.#TaskId.#Seq < :Seq and not #Tasks.#TaskId.#Status in (:TERMINAL-1, :TERMINAL-2)',
        ExpressionAttributeNames: {
          '#LastModified': 'LastModified',
          '#Result': 'Result',
          '#Seq': 'Seq',
          '#Status': 'Status',
          '#TaskId': 'my-task',
          '#Tasks': 'Tasks',
        },
        ExpressionAttributeValues: {
          ':LastModified': 42,
          ':Result': { hello: 'world' },
          ':Seq': 7,
          ':Status': 'my-status',
          ':TERMINAL-1': 'TERMINAL-1',
          ':TERMINAL-2': 'TERMINAL-2',
        },
      }));
  });
});
