const { get, parse } = require('json-pointer');

function getTaskDependencies(params) {
  return Object.keys(params)
    .map(key => params[key])
    .filter(({ $ref }) => $ref !== undefined)
    .map(({ $ref }) => {
      const [taskId] = parse($ref);
      return taskId;
    })
    .filter(taskId => taskId !== undefined);
}

function validate(params, tasks) {
  function validateParam({ $ref }) {
    if ($ref === undefined) {
      return true;
    }
    const [taskId, results] = parse($ref);
    return tasks[taskId] && results === 'Result';
  }
  return Object.keys(params)
    .reduce((args, key) => Object.assign({ [key]: validateParam(params[key]) }, args), {});
}

function evaluateParams(params, tasks) {
  function evaluateParam(param) {
    const { $ref } = param;
    return ($ref) ? get(tasks, $ref) : param;
  }
  return Object.keys(params)
    .reduce((args, key) => Object.assign({ [key]: evaluateParam(params[key]) }, args), {});
}

module.exports = {
  getTaskDependencies,
  evaluateParams,
  validate,
};
