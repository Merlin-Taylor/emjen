const assert = require('assert');
const Promise = require('bluebird');
const forever = require('../forever');
const listen = require('../listen');
const { MESSAGE_TYPE: { NewJob } } = require('../message');
const jobsDb = require('./jobs-db');
const receiver = require('./receiver');
const rules = require('./rules');

const ORCHESTRATOR_RULES_PERIOD = 5000;

function start({
  inboundQueue,
  logger = console,
  queueClient,
  stateTable,
  tableClient,
  workQueue,
} = {}) {
  const { log } = logger;
  const JobsDb = jobsDb({ tableClient, TableName: stateTable, logger });

  log(`Starting orchestrator. Listening to ${inboundQueue}. Sending work to ${workQueue}.`);

  function converge() {
    const activeJobsP = JobsDb.scanActive().catch((error) => { log(error); return []; });
    function runActions(actions) {
      assert(actions[Symbol.iterator] !== undefined);
      return Promise.map(actions, action => action({
        jobsDb: JobsDb,
        orchestratorQueueUrl: inboundQueue,
        queueClient,
        workQueueUrl: workQueue,
      }).catch(log));
    }
    return activeJobsP
      .then((jobs) => { assert(jobs[Symbol.iterator] !== undefined); return jobs; })
      .then(jobs => Promise.map(jobs, job => runActions(rules.apply(job))))
      .then(() => Promise.delay(ORCHESTRATOR_RULES_PERIOD));
  }

  const cancellationToken = { cancel: false };
  const convergeForeverP = forever(cancellationToken, () => converge().catch(log));
  const receive = receiver({ JobsDb, logger });
  const receiveForeverP = listen(queueClient, cancellationToken, inboundQueue, receive, logger);
  const runningP = Promise.all([receiveForeverP, convergeForeverP]);
  return {
    stop() {
      cancellationToken.cancel = true;
      return runningP;
    },
    submit(job) {
      return receive({ Job: job, Type: NewJob });
    },
  };
}

module.exports = {
  start,
};
