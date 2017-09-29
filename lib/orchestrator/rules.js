const assert = require('assert');
const fp = require('lodash/fp');
const jobRules = require('./job-rules');
const taskRules = require('./task-rules');

function createTaskRules(tasks) {
  const tr = taskRules(tasks);
  return fp.flow(
    fp.toPairs,
    fp.flatMap(([taskId, task]) => (tr.goal(task)
      ? []
      : fp.map(([predicate, action]) => [
        predicate.bind(null, task),
        action.bind(null, taskId, task)])(tr.rules)))
  )(tasks);
}

function createActions(rules, job) {
  return fp.flow(
    fp.filter(([predicate]) => predicate(job)),
    fp.flatMap(([, action]) => action(job)),
    fp.map((x) => { assert(typeof x === 'function', `action(...) must return a function but returned: ${x}`); return x; })
  )(rules);
}

function apply(job) {
  const jr = jobRules();
  const rules = [...jr.rules, ...createTaskRules(job.Tasks)];
  return jr.goal(job)
    ? []
    : createActions(rules, job);
}

module.exports = { apply };
