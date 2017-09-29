const assert = require('assert');

function foreverAsync(cancellationToken, fn, init) {
  assert(cancellationToken);
  assert(typeof fn === 'function');
  const { cancel } = cancellationToken;
  assert(typeof cancel === 'boolean');

  const resolveImmediate = () => new Promise(resolve => setImmediate(resolve));

  function recur(result) {
    return cancellationToken.cancel
      ? Promise.resolve(result)
      : resolveImmediate().then(() => result).then(fn).then(recur);
  }

  return recur(init);
}

module.exports = foreverAsync;
