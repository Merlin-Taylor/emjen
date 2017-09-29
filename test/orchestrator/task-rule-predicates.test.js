

const proxyquire = require('proxyquire');
require('should');
const {
  STATUS: {
    pending, queued, completed, failed,
  },
} = require('../../lib/task');

const NOW = 42;
const {
  canEvaluateArgs, isBlocked, isExpired, isRunnable,
} = proxyquire('../../lib/orchestrator/task-rule-predicates', {
  '../now': () => NOW,
});

describe('orchestrator/task-rule-predicates', () => {
  describe('isBlocked', () => {
    context('when the task depends on a failed task', () => {
      it('it returns true', () => {
        isBlocked(
          { Status: queued, DependsOn: ['T1', 'T2'] },
          { Tasks: { T1: { Status: completed }, T2: { Status: failed } } }
        ).should.be.true();
      });
    });
    context('when the task is in a terminal state', () => {
      it('it returns false', () => {
        isBlocked(
          { Status: completed, DependsOn: ['T1', 'T2'] },
          { Tasks: { T1: { Status: completed }, T2: { Status: failed } } }
        ).should.be.false();
      });
    });
    context('when the task depends only on tasks that have not failed', () => {
      it('it returns false', () => {
        isBlocked(
          { Status: queued, DependsOn: ['T1', 'T2'] },
          { Tasks: { T1: { Status: completed }, T2: { Status: pending } } }
        ).should.be.false();
      });
    });
    context('when the task depends on no other task', () => {
      it('it returns false', () => {
        isBlocked({ Status: queued }, { Tasks: {} }).should.be.false();
      });
    });
  });
  describe('isExpired', () => {
    context('when the task is in a terminal state', () => {
      it('it returns false', () => {
        isExpired({ QueuedTimestamp: NOW - 2, Status: completed, TTL: 1 }).should.be.false();
      });
    });
    context('when the task has no QueuedTimestamp', () => {
      it('it returns false', () => {
        isExpired({ Status: pending, TTL: 1 }).should.be.false();
      });
    });
    context('when the task has a null QueuedTimestamp', () => {
      it('it returns false', () => {
        isExpired({ QueuedTimestamp: null, Status: pending, TTL: 1 }).should.be.false();
      });
    });
    context('when the task has a QueuedTimestamp', () => {
      context('and it is more than TTL milliseconds in the past', () => {
        it('it returns true', () => {
          isExpired({ QueuedTimestamp: NOW - 2, Status: pending, TTL: 1 }).should.be.true();
        });
      });
      context('and it is less than TTL milliseconds in the past', () => {
        it('it returns false', () => {
          isExpired({ QueuedTimestamp: NOW - 1, Status: pending, TTL: 1 }).should.be.false();
        });
      });
    });
  });
  describe('canEvaluateArgs', () => {
    context('when the task depends only on completed tasks', () => {
      it('it returns true', () => {
        canEvaluateArgs(
          { Status: pending, DependsOn: ['T1', 'T2'] },
          { Tasks: { T1: { Status: completed }, T2: { Status: completed } } }
        ).should.be.true();
      });
    });
    context('when the task is not in a pending state', () => {
      it('it returns false', () => {
        canEvaluateArgs({ Status: queued }, { Tasks: {} }).should.be.false();
      });
    });
    context('when the task depends on a task which is not completed', () => {
      it('it returns false', () => {
        canEvaluateArgs(
          { Status: pending, DependsOn: ['T1', 'T2'] },
          { Tasks: { T1: { Status: completed }, T2: { Status: pending } } }
        ).should.be.false();
      });
    });
    context('when the task depends on no other task', () => {
      it('it returns true', () => {
        canEvaluateArgs({ Status: pending }, { Tasks: {} }).should.be.true();
      });
    });
  });
  describe('isRunnable', () => {
    context('when the task is in a pending state', () => {
      context('and its arguments are evaluated', () => {
        it('it returns true', () => {
          isRunnable({ Args: {}, Status: pending }).should.be.true();
        });
      });
      context('but its arguments are not evaluated', () => {
        it('it returns false', () => {
          isRunnable({ Args: {}, Status: queued }).should.be.false();
        });
      });
    });
    context('when the task is not in a pending state', () => {
      it('it returns false', () => {
        isRunnable({ Args: {}, Status: queued }).should.be.false();
      });
    });
  });
});
