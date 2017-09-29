const now = require('../now');
const { STATUS: { pending, queued, failed } } = require('../task');
const { MESSAGE_TYPE: { RunTask } } = require('../message');
const validate = require('../validate-message');
const { evaluateParams } = require('./params');

function enqueueTask(TaskId, {
  Args, Command, Seq, TTL,
}, { JobId, User }) {
  return [({
    jobsDb, orchestratorQueueUrl, queueClient, workQueueUrl,
  }) => {
    const t = now();
    const seq = Seq + 1;
    const message = {
      Type: RunTask,
      JobId,
      TaskId,
      Command,
      Args,
      ReplyTo: orchestratorQueueUrl,
      Seq: seq,
      TTL: t + TTL,
      User,
    };
    const updateTask = jobsDb.updateTask.bind(null, JobId, TaskId);
    return Promise.resolve()
      .then(() => validate(RunTask, message))
      .then(() => ({ MessageBody: JSON.stringify(message), QueueUrl: workQueueUrl }))
      .then(params => queueClient.sendMessage(params))
      .then(() => updateTask({ QueuedTimestamp: t, Seq: seq, Status: queued }));
  }];
}

function markExpired(taskId, { Seq }, { JobId }) {
  function execute({ jobsDb }) {
    const updateTask = jobsDb.updateTask.bind(null, JobId, taskId);
    const Result = 'Error: The task exceeded its TTL';
    return updateTask({ Seq: Seq + 1, Status: failed, Result });
  }
  return [execute];
}

function markBlocked(taskId, { Seq }, { JobId }) {
  function execute({ jobsDb }) {
    const updateTask = jobsDb.updateTask.bind(null, JobId, taskId);
    const Result = 'Error: The task cannot proceed because one or more of its dependencies failed';
    return updateTask({ Seq: Seq + 1, Status: failed, Result });
  }
  return [execute];
}

function setArguments(taskId, { Params = {}, Seq }, { JobId, Tasks }) {
  const Args = evaluateParams(Params, Tasks);
  function execute({ jobsDb }) {
    const setTaskArgs = jobsDb.setTaskArgs.bind(null, JobId, taskId);
    return setTaskArgs({ Args, Seq: Seq + 1, Status: pending });
  }
  return [execute];
}

module.exports = {
  enqueueTask,
  markBlocked,
  markExpired,
  setArguments,
};
