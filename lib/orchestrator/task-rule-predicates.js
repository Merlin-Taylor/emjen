

const assert = require('assert');
const now = require('../now');
const { isTerminalState, STATUS: { pending, completed, failed } } = require('../task');
const { getTaskDependencies } = require('./params');

function getAllDepenedencies({ DependsOn = [], Params = {} }) {
  return [...DependsOn, ...getTaskDependencies(Params)];
}

function isExpired({ QueuedTimestamp, Status, TTL }) {
  assert(QueuedTimestamp === undefined
    || QueuedTimestamp === null
    || (typeof QueuedTimestamp === 'number' && QueuedTimestamp > 0), QueuedTimestamp);
  assert(typeof Status === 'string', Status);
  assert(typeof TTL === 'number' && TTL > 0, TTL);
  const currentTime = now();
  return !isTerminalState(Status)
    && QueuedTimestamp !== undefined
    && QueuedTimestamp !== null
    && currentTime > QueuedTimestamp + TTL;
}

function isRunnable({ Args, Status }) {
  return Status === pending && Args !== undefined;
}

function isBlocked(task, { Tasks }) {
  const { Status } = task;
  return !isTerminalState(Status)
    && getAllDepenedencies(task).some(dependency => Tasks[dependency].Status === failed);
}

function canEvaluateArgs(task, { Tasks }) {
  const { Args, Status } = task;
  return Status === pending
    && Args === undefined
    && getAllDepenedencies(task).every(dependency => Tasks[dependency].Status === completed);
}

module.exports = {
  canEvaluateArgs,
  isBlocked,
  isExpired,
  isRunnable,
};
