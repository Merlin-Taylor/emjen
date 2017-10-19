const assert = require('assert');
const Promise = require('bluebird');

function foreverAsync(cancellationToken, fn, init) {
  assert(cancellationToken);
  assert(typeof fn === 'function');
  const { cancel } = cancellationToken;
  assert(typeof cancel === 'boolean');

  const fnP = Promise.method(fn);
  return new Promise((resolve, reject) => {
    /*
    * The previous implementation of recur was a simple recursive function returning a Promise.
    * This resulted in a memory leak when combined with bluebird.longStackTraces, a feature which
    * accumulates stack information from one chained promise to the next.
    * The implementation below fixes this by using setImmediate to break the chain of Promises.
    */
    function recur(state) {
      if (cancellationToken && cancellationToken.cancel) {
        resolve(state);
      } else {
        setImmediate(() => fnP(state).then(recur, (e) => { reject(e); }));
      }
    }
    recur(init);
  });
}

module.exports = foreverAsync;
