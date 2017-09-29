const assert = require('assert');
const Promise = require('bluebird');
const forever = require('./forever');

function listen(queueClient, cancellationToken, QueueUrl, processMessage, logger) {
  const { log } = logger;
  function receive() {
    assert(typeof queueClient === 'object' && queueClient !== null);
    assert(typeof QueueUrl === 'string');
    assert(typeof processMessage === 'function');

    const params = {
      MaxNumberOfMessages: 5,
      QueueUrl,
      WaitTimeSeconds: 2,
    };

    function receiveOne(message) {
      const { Body, ReceiptHandle } = message || {};
      assert(typeof Body === 'string');
      assert(typeof ReceiptHandle === 'string');
      return Promise.resolve()
        .then(() => processMessage(JSON.parse(Body)))
        .then(() => queueClient.deleteMessage({ QueueUrl, ReceiptHandle }))
        .catch(log);
    }

    return queueClient.receiveMessage(params)
      .then(({ Messages = [] }) => {
        assert(Messages[Symbol.iterator] !== undefined);
        return Promise.map(Messages, receiveOne);
      });
  }

  return forever(cancellationToken, () => receive().catch(log));
}

module.exports = listen;
