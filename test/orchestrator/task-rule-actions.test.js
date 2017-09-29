

const proxyquire = require('proxyquire').noCallThru();
require('should');
const sinon = require('sinon');

const NOW = 42;

function createFakes() {
  return {
    '../now': () => NOW,
  };
}

function fakeJobsDb() {
  return {
    updateTask: sinon.spy(() => Promise.resolve()),
  };
}

function actions(fakes) {
  return proxyquire('../../lib/orchestrator/task-rule-actions', fakes);
}

describe('orchestrator/task-rule-actions', () => {
  describe('enqueueTask', () => {
    const taskid = 'my-task';
    const task = {
      Args: {}, Command: 'my-command', Seq: 0, TTL: 10,
    };
    const job = { JobId: 'my-job', User: 'billy-bob' };
    it('it returns an array containing one action', () => {
      const result = actions(createFakes()).enqueueTask(taskid, task, job);
      result.should.be.Array();
      result.should.have.length(1);
      result[0].should.be.Function();
    });
    context('when the action is executed', () => {
      it('it sends the expected message to the work queue', () => {
        const fakes = createFakes();
        const queueClient = { sendMessage: sinon.spy(() => Promise.resolve()) };
        const [action] = actions(fakes).enqueueTask(taskid, task, job);
        const args = {
          jobsDb: fakeJobsDb(), orchestratorQueueUrl: 'oq', queueClient, workQueueUrl: 'wq',
        };
        const expectedParams =
          {
            MessageBody: JSON.stringify({
              Type: 'RunTask',
              JobId: 'my-job',
              TaskId: 'my-task',
              Command: 'my-command',
              Args: {},
              ReplyTo: 'oq',
              Seq: 1,
              TTL: NOW + 10,
              User: 'billy-bob',
            }),
            QueueUrl: 'wq',
          };
        return action(args)
          .then(() => sinon.assert.calledOnce(queueClient.sendMessage))
          .then(() => sinon.assert.calledWithExactly(queueClient.sendMessage, expectedParams));
      });
    });
    context('when the attempt to send the message fails', () => {
      it('it does not update the status of the task', () => {
        const queueClient = { sendMessage: () => Promise.reject(new Error('BOOM!')) };
        const [action] = actions(createFakes()).enqueueTask(taskid, task, job);
        const args = {
          jobsDb: fakeJobsDb(), orchestratorQueueUrl: 'oq', queueClient, workQueueUrl: 'wq',
        };
        return action(args)
          .catch(() => undefined)
          .then(() => sinon.assert.notCalled(args.jobsDb.updateTask));
      });
    });
    context('when the attempt to send the message succeeds', () => {
      it('it updates the task', () => {
        const fakes = createFakes();
        const queueClient = { sendMessage: () => Promise.resolve() };
        const [action] = actions(fakes).enqueueTask(taskid, task, job);
        const args = {
          jobsDb: fakeJobsDb(), orchestratorQueueUrl: 'oq', queueClient, workQueueUrl: 'wq',
        };
        return action(args)
          .then(() => sinon.assert.calledOnce(args.jobsDb.updateTask))
          .then(() => sinon.assert.calledWithExactly(
            args.jobsDb.updateTask,
            'my-job', 'my-task', { QueuedTimestamp: NOW, Seq: 1, Status: 'queued' }
          ));
      });
    });
  });
  describe('markBlocked', () => {
    const taskid = 'my-task';
    const task = { Args: {}, Command: 'my-command', Seq: 0 };
    const job = { JobId: 'my-job' };
    it('it returns an array containing one function', () => {
      const result = actions(createFakes()).markBlocked(taskid, task, job);
      result.should.be.Array();
      result.should.have.length(1);
      result[0].should.be.Function();
    });
    context('when the action is executed', () => {
      it('it updates the task', () => {
        const [action] = actions(createFakes()).markBlocked(taskid, task, job);
        const args = { jobsDb: fakeJobsDb(), orchestratorQueueUrl: 'oq', workQueueUrl: 'wq' };
        return action(args)
          .then(() => sinon.assert.calledOnce(args.jobsDb.updateTask))
          .then(() => sinon.assert.calledWithExactly(
            args.jobsDb.updateTask,
            'my-job', 'my-task', { Seq: 1, Status: 'failed', Result: 'Error: The task cannot proceed because one or more of its dependencies failed' }
          ));
      });
    });
  });
  describe('markExpired', () => {
    const taskid = 'my-task';
    const task = { Args: {}, Command: 'my-command', Seq: 0 };
    const job = { JobId: 'my-job' };
    it('it returns an array containing one function', () => {
      const result = actions(createFakes()).markExpired(taskid, task, job);
      result.should.be.Array();
      result.should.have.length(1);
      result[0].should.be.Function();
    });
    context('when the action is executed', () => {
      it('it updates the task', () => {
        const [action] = actions(createFakes()).markExpired(taskid, task, job);
        const args = { jobsDb: fakeJobsDb(), orchestratorQueueUrl: 'oq', workQueueUrl: 'wq' };
        return action(args)
          .then(() => sinon.assert.calledOnce(args.jobsDb.updateTask))
          .then(() => sinon.assert.calledWithExactly(
            args.jobsDb.updateTask,
            'my-job', 'my-task', { Seq: 1, Status: 'failed', Result: 'Error: The task exceeded its TTL' }
          ));
      });
    });
  });
});
