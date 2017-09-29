

const { isTerminalState } = require('../task');
const {
  canEvaluateArgs, isBlocked, isExpired, isRunnable,
} = require('./task-rule-predicates');
const {
  enqueueTask, markBlocked, markExpired, setArguments,
} = require('./task-rule-actions');

function createTaskRules() {
  return {
    goal({ Status }) {
      return isTerminalState(Status);
    },

    rules: [
      [canEvaluateArgs, setArguments],
      [isRunnable, enqueueTask],
      [isExpired, markExpired],
      [isBlocked, markBlocked],
    ],
  };
}

module.exports = createTaskRules;
