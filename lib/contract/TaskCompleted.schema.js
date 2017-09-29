module.exports = {
  $id: 'http://thetrainline.com/job-engine/message/TaskCompleted-schema#',
  $schema: 'http://json-schema.org/draft-06/schema#',
  title: 'TaskCompleted',
  description: 'A message notifying that an task has completed',
  type: 'object',
  properties: {
    JobId: { type: 'string' },
    Seq: { type: 'integer', minimum: 0 },
    Status: { type: 'string', enum: ['completed'] },
    Result: { },
    Type: { type: 'string', pattern: 'TaskCompleted' },
  },
  required: [
    'JobId',
    'Result',
    'Seq',
    'Status',
    'Type',
  ],
};
