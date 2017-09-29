module.exports = {
  $id: 'http://thetrainline.com/job-engine/message/TaskStarted-schema#',
  $schema: 'http://json-schema.org/draft-06/schema#',
  title: 'TaskStarted',
  description: 'A message notifying that an task has started',
  type: 'object',
  properties: {
    JobId: { type: 'string' },
    Seq: { type: 'integer', minimum: 0 },
    Status: { type: 'string', enum: ['running'] },
    Type: { type: 'string', pattern: 'TaskStarted' },
  },
  required: [
    'JobId',
    'Seq',
    'Status',
    'Type',
  ],
};
