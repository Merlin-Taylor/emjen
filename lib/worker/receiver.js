const assert = require('assert');
const Promise = require('bluebird');
const now = require('../now');
const { STATUS: { failed } } = require('../task');
const { MESSAGE_TYPE: { RunTask, TaskFailed } } = require('../message');
const validate = require('../validate-message');

function createReceiver({
  commands, logger: { log }, queueClient, workQueueUrl,
}) {
  function send(message, QueueUrl, content, DelaySeconds) {
    const {
      JobId, TaskId, Seq, User,
    } = message;
    return Promise.resolve().then(() => {
      const body = Object.assign({}, content, {
        JobId, TaskId, Seq: Seq + 1, User,
      });
      const params = Object.assign(
        {
          MessageBody: JSON.stringify(body),
          QueueUrl,
        },
        DelaySeconds !== undefined ? { DelaySeconds } : {}
      );
      validate(body.Type, body);
      return queueClient.sendMessage(params);
    });
  }

  function executeForMessage(message, command) {
    assert(typeof command === 'function');
    const { TTL } = message;
    const sendToReplyQueue = send.bind(null, message, message.ReplyTo);
    const sendToWorkQueue = send.bind(null, message, workQueueUrl);
    if (TTL < now()) {
      return sendToReplyQueue({ Type: TaskFailed, Status: failed, Result: 'TTL Expired' });
    } else if (command === undefined) {
      return sendToReplyQueue({ Type: TaskFailed, Status: failed, Result: `Unknown command: ${command}` });
    }
    return Promise.resolve(message).then(m => command(m, { sendToWorkQueue, sendToReplyQueue }));
  }

  function onRunTask(message) {
    const { Command } = message;
    const execute = executeForMessage.bind(null, message);
    return Promise.resolve(commands[Command])
      .then(execute)
      .catch((error) => {
        log(error);
        return send(message, message.ReplyTo, { Type: TaskFailed, Status: failed, Result: `${error}` });
      });
  }

  function processMessage(message) {
    const { Type } = message;
    log(`worker received message: ${Type}`);
    switch (Type) {
      case RunTask:
        validate(RunTask, message);
        return onRunTask(message);
      default:
        return Promise.reject(new Error(`Unknown message type: ${Type}`));
    }
  }

  return processMessage;
}

module.exports = createReceiver;
