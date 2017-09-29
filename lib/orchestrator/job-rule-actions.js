const fp = require('lodash/fp');
const { STATUS: { completed, failed } } = require('../task');

function terminateJob({ JobId, Tasks }) {
  const terminalStatus = fp.flow(
    fp.toPairs,
    fp.some(([, { Status }]) => Status === failed),
    someFailed => (someFailed ? failed : completed)
  )(Tasks);
  return [({ jobsDb }) => jobsDb.updateJob(JobId, { Status: terminalStatus })];
}

module.exports = {
  terminateJob,
};
