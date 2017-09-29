

const proxyquire = require('proxyquire').noCallThru();
const should = require('should');
const sinon = require('sinon');

const id = x => x;

function createFakes({
  isTerminalState = () => false,
  jobRules = () => [],
  taskRules = () => [],
} = {}) {
  return {
    '../task': { isTerminalState },
    './job-rules': () => ({ goal: () => false, rules: jobRules() }),
    './task-rules': tasks => ({ goal: () => false, rules: taskRules(tasks) }),
  };
}

function rules(fakes) {
  return proxyquire('../../lib/orchestrator/rules', fakes);
}

describe('orchestrator/rules', () => {
  context('when given a single job rule', () => {
    it('the predicate is called with the job as its argument', () => {
      const predicate = sinon.spy(() => false);
      const action = id;
      const { apply } = rules(createFakes({ jobRules: () => [[predicate, action]] }));
      const job = {};
      apply(job);
      sinon.assert.calledOnce(predicate);
      sinon.assert.calledWithExactly(predicate, job);
    });
    context('and the predicate returns false', () => {
      const predicate = () => false;
      it('the action is not called', () => {
        const action = sinon.spy();
        const { apply } = rules(createFakes({ jobRules: () => [[predicate, action]] }));
        const job = {};
        apply(job);
        sinon.assert.notCalled(action);
      });
    });
    context('and the predicate returns true', () => {
      const predicate = () => true;
      it('the action is called with the job as its argument', () => {
        const action = sinon.spy(() => [id]);
        const { apply } = rules(createFakes({ jobRules: () => [[predicate, action]] }));
        const job = {};
        apply(job);
        sinon.assert.calledOnce(action);
        sinon.assert.calledWithExactly(action, job);
      });
      it('it returns an array containing the functions returned by the call to action', () => {
        const f = () => 'f';
        const g = () => 'g';
        const action = () => [f, g];
        const { apply } = rules(createFakes({ jobRules: () => [[predicate, action]] }));
        const job = {};
        apply(job).should.eql([f, g]);
      });
      context('and the action does not return an array of functions', () => {
        it('it raises an error', () => {
          const action = () => 'a';
          const { apply } = rules(createFakes({ jobRules: () => [[predicate, action]] }));
          const job = {};
          should(() => apply(job)).throw('action(...) must return a function but returned: a');
        });
      });
    });
  });
  context('when given a number of job and task rules', () => {
    const predicate = () => true;
    it('returns the union of their actions', () => {
      const { apply } = rules(createFakes({
        jobRules: () => [
          [predicate, () => [id, id]],
          [predicate, () => [id, id, id]],
        ],
        taskRules: () => [
          [predicate, () => [id, id]],
          [predicate, () => [id, id, id]],
        ],
      }));
      const job = { Tasks: { T1: {} } };
      apply(job).should.have.length(10);
    });
  });
  context('when given a single task rule', () => {
    context('and a single task', () => {
      it('the predicate is called with the task and job as its arguments', () => {
        const predicate = sinon.spy(() => false);
        const action = id;
        const { apply } = rules(createFakes({ taskRules: () => [[predicate, action]] }));
        const task = { Status: 'pending' };
        const job = { JobId: 'my-job', Tasks: { T1: task } };
        apply(job);
        sinon.assert.calledOnce(predicate);
        sinon.assert.calledWithExactly(predicate, task, job);
      });
      context('and the predicate returns false', () => {
        const predicate = () => false;
        it('the action is not called', () => {
          const action = sinon.spy();
          const { apply } = rules(createFakes({ taskRules: () => [[predicate, action]] }));
          const job = {};
          apply(job);
          sinon.assert.notCalled(action);
        });
      });
      context('and the predicate returns true', () => {
        const predicate = () => true;
        it('the action is called with the task ID, task and job as its arguments', () => {
          const action = sinon.spy(() => [id]);
          const { apply } = rules(createFakes({ taskRules: () => [[predicate, action]] }));
          const task = { Status: 'pending' };
          const job = { JobId: 'my-job', Tasks: { T1: task } };
          apply(job);
          sinon.assert.calledOnce(action);
          sinon.assert.calledWithExactly(action, 'T1', task, job);
        });
        it('it returns an array containing the functions returned by the call to action', () => {
          const f = () => 'f';
          const g = () => 'g';
          const action = () => [f, g];
          const { apply } = rules(createFakes({ taskRules: () => [[predicate, action]] }));
          const job = { JobId: 'my-job', Tasks: { T1: {} } };
          apply(job).should.eql([f, g]);
        });
      });
    });
    context('and many tasks', () => {
      it('the predicate is called with the each task and job as its arguments', () => {
        const predicate = sinon.spy(() => false);
        const action = id;
        const { apply } = rules(createFakes({ taskRules: () => [[predicate, action]] }));
        const job = { JobId: 'my-job', Tasks: { T1: 1, T2: 2 } };
        apply(job);
        sinon.assert.calledTwice(predicate);
        sinon.assert.calledWithExactly(predicate, 1, job);
        sinon.assert.calledWithExactly(predicate, 2, job);
      });
      context('and the predicate returns true', () => {
        const predicate = () => true;
        it('the action is called with each task ID, task and job as its arguments', () => {
          const action = sinon.spy(() => [id]);
          const { apply } = rules(createFakes({ taskRules: () => [[predicate, action]] }));
          const job = { JobId: 'my-job', Tasks: { T1: 1, T2: 2 } };
          apply(job);
          sinon.assert.calledTwice(action);
          sinon.assert.calledWithExactly(action, 'T1', 1, job);
          sinon.assert.calledWithExactly(action, 'T2', 2, job);
        });
        it('it returns an array containing the functions returned by the call to action', () => {
          const action = (taskid, task, job) => [
            () => ['f', taskid, task, job.JobId],
            () => ['g', taskid, task, job.JobId],
          ];
          const { apply } = rules(createFakes({ taskRules: () => [[predicate, action]] }));
          const job = { JobId: 'my-job', Tasks: { T1: 1, T2: 2 } };
          apply(job).map(fn => fn()).should.eql([
            ['f', 'T1', 1, 'my-job'],
            ['g', 'T1', 1, 'my-job'],
            ['f', 'T2', 2, 'my-job'],
            ['g', 'T2', 2, 'my-job'],
          ]);
        });
      });
    });
  });
});
