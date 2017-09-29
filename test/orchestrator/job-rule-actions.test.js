

const should = require('should');
const sinon = require('sinon');
const { terminateJob } = require('../../lib/orchestrator/job-rule-actions');
const { STATUS: { completed, failed } } = require('../../lib/task');

describe('orchestrator/job-rule-actions', () => {
  describe('terminateJob', () => {
    context('when at least one task has failed', () => {
      const job = { JobId: 'j1', Tasks: { T1: { Status: failed }, T2: { Status: completed } } };
      it('it returns a single action', () => {
        const actions = terminateJob(job);
        should(actions.length).eql(1);
      });
      it('it returns an action that updates the job status to failed', () => {
        const [action] = terminateJob(job);
        const jobsDb = { updateJob: sinon.spy() };
        action({ jobsDb });
        sinon.assert.calledWithExactly(jobsDb.updateJob, 'j1', { Status: failed });
      });
    });
    context('when every task has completed', () => {
      const job = { JobId: 'j1', Tasks: { T1: { Status: completed }, T2: { Status: completed } } };
      it('it returns a single action', () => {
        const actions = terminateJob(job);
        should(actions.length).eql(1);
      });
      it('it returns an action that updates the job status to completed', () => {
        const [action] = terminateJob(job);
        const jobsDb = { updateJob: sinon.spy() };
        action({ jobsDb });
        sinon.assert.calledWithExactly(jobsDb.updateJob, 'j1', { Status: completed });
      });
    });
  });
});
