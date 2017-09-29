

const { terminalStates } = require('../task');
const now = require('../now');

function getJobRequest({ JobId, TableName }) {
  return { TableName, Key: { JobId } };
}

function scanActiveRequest({ TableName }) {
  return {
    TableName,
    IndexName: 'Status-index',
    KeyConditionExpression: '#Status = :Status',
    ExpressionAttributeNames: {
      '#Status': 'Status',
    },
    ExpressionAttributeValues: {
      ':Status': 'active',
    },
  };
}

function insertJobRequest({ Job, TableName }) {
  return {
    TableName,
    Item: Job,
    ConditionExpression: 'attribute_not_exists(JobId)',
  };
}

function setTaskArgsRequest({
  Args, JobId, TaskId, Seq, Status, TableName,
}) {
  return {
    TableName,
    Key: { JobId },
    UpdateExpression: 'SET #Tasks.#TaskId.#LastModified = :LastModified, #Tasks.#TaskId.#Seq = :Seq, #Tasks.#TaskId.#Status = :Status, #Tasks.#TaskId.#Args = :Args',
    ConditionExpression: `attribute_not_exists(#Tasks.#TaskId.#Args) and #Tasks.#TaskId.#Seq < :Seq and not #Tasks.#TaskId.#Status in (${terminalStates.map(s => `:${s}`).join(', ')})`,
    ExpressionAttributeNames: {
      '#Args': 'Args',
      '#LastModified': 'LastModified',
      '#Seq': 'Seq',
      '#Status': 'Status',
      '#TaskId': TaskId,
      '#Tasks': 'Tasks',
    },
    ExpressionAttributeValues: Object.assign(
      {
        ':Args': Args,
        ':LastModified': now(),
        ':Seq': Seq,
        ':Status': Status,
      },
      ...terminalStates.map(s => ({ [`:${s}`]: s }))
    ),
  };
}

function updateTaskRequest({
  JobId, TaskId, QueuedTimestamp, Seq, Status, TableName, Result,
}) {
  return {
    TableName,
    Key: { JobId },
    UpdateExpression: [
      'SET #Tasks.#TaskId.#LastModified = :LastModified, #Tasks.#TaskId.#Seq = :Seq, #Tasks.#TaskId.#Status = :Status',
      QueuedTimestamp !== undefined ? '#Tasks.#TaskId.#QueuedTimestamp = :QueuedTimestamp' : undefined,
      Result !== undefined ? '#Tasks.#TaskId.#Result = :Result' : undefined,
    ].filter(s => s !== undefined).join(', '),
    ConditionExpression: `#Tasks.#TaskId.#Seq < :Seq and not #Tasks.#TaskId.#Status in (${terminalStates.map(s => `:${s}`).join(', ')})`,
    ExpressionAttributeNames: Object.assign(
      {
        '#LastModified': 'LastModified',
        '#Seq': 'Seq',
        '#Status': 'Status',
        '#TaskId': TaskId,
        '#Tasks': 'Tasks',
      },
      QueuedTimestamp !== undefined ? { '#QueuedTimestamp': 'QueuedTimestamp' } : {},
      Result ? { '#Result': 'Result' } : {}
    ),
    ExpressionAttributeValues: Object.assign(
      {
        ':LastModified': now(),
        ':Seq': Seq,
        ':Status': Status,
      },
      ...terminalStates.map(s => ({ [`:${s}`]: s })),
      QueuedTimestamp !== undefined ? { ':QueuedTimestamp': QueuedTimestamp } : {},
      Result ? { ':Result': Result } : {}
    ),
  };
}

function updateJobRequest({ JobId, Status, TableName }) {
  return {
    TableName,
    Key: { JobId },
    UpdateExpression: 'SET #Status = :Status',
    ConditionExpression: `not #Status in (${terminalStates.map(s => `:${s}`).join(', ')})`,
    ExpressionAttributeNames: { '#Status': 'Status' },
    ExpressionAttributeValues: Object.assign(
      { ':Status': Status },
      ...terminalStates.map(s => ({ [`:${s}`]: s }))
    ),
  };
}

module.exports = {
  getJobRequest,
  insertJobRequest,
  scanActiveRequest,
  setTaskArgsRequest,
  updateJobRequest,
  updateTaskRequest,
};
