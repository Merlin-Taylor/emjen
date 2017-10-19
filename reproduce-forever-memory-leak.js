const console = require('console');
global.Promise = require('bluebird');
const forever = require('./lib/forever');

function f(i) {
  return Promise.delay(0).then(() => (i + 1) % 7);
}

function displayMemoryUsage() {
  const mem = process.memoryUsage();
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}  ${mem.rss}`);
}

setInterval(displayMemoryUsage, 500);
setTimeout(() => { process.exit(0); }, 5000);
forever({ cancel: false }, f, 0);
