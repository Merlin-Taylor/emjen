const assert = require('assert');
const listen = require('../listen');
const receiver = require('./receiver');

function start({
  commands, inboundQueue, queueClient, logger = console,
}) {
  const { log } = logger;
  assert(commands && typeof commands === 'object');
  assert(typeof inboundQueue === 'string');
  log(`Starting worker. Listening to ${inboundQueue}. Supported commands: ${Object.keys(commands).join(', ')}.`);
  const cancellationToken = { cancel: false };
  const receive = receiver({
    commands, logger, queueClient, workQueueUrl: inboundQueue,
  });
  const receiveForeverP = listen(queueClient, cancellationToken, inboundQueue, receive, logger);
  return {
    stop() {
      cancellationToken.cancel = true;
      return receiveForeverP;
    },
  };
}

module.exports = {
  start,
};
