const { isTerminalState } = require('../task');
const { terminateJob } = require('./job-rule-actions');
const { hasNoReachableTasks } = require('./job-rule-predicates');

function rules() {
  return {
    goal({ Status }) {
      return isTerminalState(Status);
    },

    rules: [
      [hasNoReachableTasks, terminateJob],
    ],
  };
}

module.exports = rules;
