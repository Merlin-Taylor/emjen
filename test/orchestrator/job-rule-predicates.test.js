

require('should');
const { hasNoReachableTasks } = require('../../lib/orchestrator/job-rule-predicates');
const { STATUS: { running, completed, failed } } = require('../../lib/task');

describe('orchestrator/job-rule-predicates', () => {
  describe('hasNoReachableTasks', () => {
    context('when at least one task is in a non-terminal state', () => {
      it('it returns false', () => {
        hasNoReachableTasks({ Tasks: { T1: { Status: running }, T2: { Status: completed } } })
          .should.be.false();
      });
    });
    context('when every task is in a terminal state', () => {
      it('it returns true', () => {
        hasNoReachableTasks({ Tasks: { T1: { Status: failed }, T2: { Status: completed } } })
          .should.be.true();
      });
    });
  });
});
