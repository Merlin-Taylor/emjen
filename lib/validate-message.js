const Ajv = require('ajv');

const NewJob = require('./contract/NewJob.schema');
const RunTask = require('./contract/RunTask.schema');
const TaskCompleted = require('./contract/TaskCompleted.schema');
const TaskFailed = require('./contract/TaskFailed.schema');
const TaskStarted = require('./contract/TaskStarted.schema');

const OPTIONS = {
  allErrors: true,
  format: 'fast',
};

const SCHEMAS = {
  NewJob,
  RunTask,
  TaskCompleted,
  TaskFailed,
  TaskStarted,
};

const ajv = new Ajv(OPTIONS);
Object.keys(SCHEMAS).forEach((name) => {
  ajv.addSchema(SCHEMAS[name], name);
});

function validate(schema, message) {
  if (!ajv.validate(schema, message)) {
    throw new Error(`Schema validation failed.\n${ajv.errorsText()}\nschema=${schema}\nmessage=${JSON.stringify(message)}`);
  }
}

module.exports = validate;
