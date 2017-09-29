const Promise = require('bluebird');
const {
  MESSAGE_TYPE: {
    NewJob, TaskStarted, TaskCompleted, TaskFailed,
  },
} = require('../message');
const validate = require('../validate-message');

function create({ JobsDb, logger: { log } }) {
  function onNewJob(job) {
    return JobsDb.insertJob(job);
  }

  function onTaskStarted({
    JobId, TaskId, Seq, Status,
  }) {
    return JobsDb.updateTask(JobId, TaskId, { Seq, Status });
  }

  function onTaskCompleted({
    JobId, TaskId, Seq, Status, Result,
  }) {
    return JobsDb.updateTask(JobId, TaskId, { Seq, Status, Result });
  }

  function onTaskFailed({
    JobId, TaskId, Seq, Status, Result,
  }) {
    return JobsDb.updateTask(JobId, TaskId, { Seq, Status, Result });
  }

  function processMessage(message) {
    const { Type } = message;
    log(`orchestrator received message: ${Type}`);
    switch (Type) {
      case NewJob:
        validate(NewJob, message);
        return onNewJob(message.Job);
      case TaskStarted:
        validate(TaskStarted, message);
        return onTaskStarted(message);
      case TaskCompleted:
        validate(TaskCompleted, message);
        return onTaskCompleted(message);
      case TaskFailed:
        validate(TaskFailed, message);
        return onTaskFailed(message);
      default:
        return Promise.reject(new Error(`Unknown message type: ${Type}`));
    }
  }

  return processMessage;
}

module.exports = create;
