const completed = 'completed';
const failed = 'failed';
const pending = 'pending';
const queued = 'queued';
const running = 'running';

const STATUS = {
  completed,
  failed,
  pending,
  queued,
  running,
};

const terminal = [completed, failed];

function isTerminalState(s) {
  return terminal.some(t => t === s);
}

module.exports = {
  STATUS,
  isTerminalState,
  terminalStates: terminal,
};
