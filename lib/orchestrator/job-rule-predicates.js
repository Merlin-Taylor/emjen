const fp = require('lodash/fp');
const { isTerminalState } = require('../task');

function hasNoReachableTasks({ Tasks }) {
  return fp.flow(
    fp.toPairs,
    fp.every(([, { Status }]) => isTerminalState(Status))
  )(Tasks);
}

module.exports = {
  hasNoReachableTasks,
};
