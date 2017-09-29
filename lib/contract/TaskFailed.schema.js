module.exports = {
  $id: 'http://thetrainline.com/job-engine/message/TaskFailed-schema#',
  $schema: 'http://json-schema.org/draft-06/schema#',
  title: 'TaskFailed',
  description: 'A message notifying that an task has failed',
  type: 'object',
  properties: {
    JobId: { type: 'string' },
    Seq: { type: 'integer', minimum: 0 },
    Status: { type: 'string', enum: ['failed'] },
    Result: { },
    Type: { type: 'string', pattern: 'TaskFailed' },
  },
  required: [
    'JobId',
    'Result',
    'Seq',
    'Status',
    'Type',
  ],
};
