const assert = require('assert');
const {
  getJobRequest,
  insertJobRequest,
  scanActiveRequest,
  setTaskArgsRequest,
  updateJobRequest,
  updateTaskRequest,
} = require('./jobs-db-request-builder');

function create({ tableClient, TableName, logger: { log } }) {
  assert(typeof tableClient === 'object' && tableClient !== null);
  assert(typeof TableName === 'string');

  function ifConditionalCheckFailed(value, message) {
    return (error) => {
      const { code } = error;
      if (code === 'ConditionalCheckFailedException') {
        log(`precondition not met while ${message()}`);
        return Promise.resolve(value);
      }
      return Promise.reject(error);
    };
  }

  function getJob(JobId) {
    const params = getJobRequest({ JobId, TableName });
    return tableClient.get(params)
      .then(({ Item }) => Item);
  }

  function scanActive() {
    const params = scanActiveRequest({ TableName });
    return tableClient.query(params)
      .then(({ Items }) => Items);
  }

  function insertJob(job) {
    assert(typeof job === 'object' && job !== null);
    const params = insertJobRequest({ Job: job, TableName });
    return tableClient.put(params)
      .then(() => true)
      .catch(ifConditionalCheckFailed(false, () => `inserting job ${job.JobId}`));
  }

  function setTaskArgs(JobId, TaskId, { Args, Seq, Status }) {
    assert(typeof Args === 'object');
    assert(typeof JobId === 'string');
    assert(typeof TaskId === 'string');
    assert(typeof Seq === 'number' && Seq >= 0);
    assert(typeof Status === 'string');
    return Promise.resolve()
      .then(() => setTaskArgsRequest({
        Args, JobId, TaskId, Seq, Status, TableName,
      }))
      .then(params => tableClient.update(params))
      .then(() => true)
      .catch(ifConditionalCheckFailed(false, () => `setting task arguments ${{
        Args, JobId, TaskId, Seq, Status, TableName,
      }}`));
  }

  function updateTask(JobId, TaskId, {
    QueuedTimestamp, Seq = 0, Status, Result,
  }) {
    assert(typeof JobId === 'string');
    assert(QueuedTimestamp === undefined || typeof QueuedTimestamp === 'number');
    assert(typeof TaskId === 'string');
    assert(typeof Seq === 'number' && Seq >= 0);
    assert(typeof Status === 'string');
    return Promise.resolve()
      .then(() => updateTaskRequest({
        JobId, TaskId, QueuedTimestamp, Seq, Status, TableName, Result,
      }))
      .then(params => tableClient.update(params))
      .then(() => true)
      .catch(ifConditionalCheckFailed(false, () => `updating task ${{
        JobId, TaskId, QueuedTimestamp, Seq, Status, Result,
      }}`));
  }

  function updateJob(JobId, { Status }) {
    assert(typeof JobId === 'string');
    assert(typeof Status === 'string');
    return Promise.resolve()
      .then(() => updateJobRequest({ JobId, Status, TableName }))
      .then(params => tableClient.update(params))
      .then(() => true)
      .catch(ifConditionalCheckFailed(false, () => `updating job ${{ JobId, Status }}`));
  }

  return {
    getJob,
    insertJob,
    scanActive,
    setTaskArgs,
    updateJob,
    updateTask,
  };
}
module.exports = create;
