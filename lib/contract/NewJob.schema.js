module.exports = {
  $id: 'http://thetrainline.com/job-engine/message/NewJob-schema#',
  $schema: 'http://json-schema.org/draft-06/schema#',
  title: 'NewJob',
  description: 'A message requesting the scheduling of a new job',
  type: 'object',
  properties: {
    Type: {
      type: 'string',
      pattern: 'NewJob',
    },
    Job: {
      type: 'object',
      properties: {
        JobId: {
          type: 'string',
        },
        Status: {
          type: 'string',
          enum: ['active', 'completed', 'failed'],
        },
        Tasks: {
          type: 'object',
          patternProperties: {
            '.*': { $ref: '#/definitions/Task' },
          },
        },
        User: {
          type: 'string',
        },
      },
      required: [
        'JobId',
        'Status',
        'Tasks',
        'User',
      ],
    },
  },
  required: [
    'Job',
    'Type',
  ],

  definitions: {
    Task: {
      description: 'A task belonging to a job',
      type: 'object',
      properties: {
        Params: { type: 'object' },
        Command: { type: 'string' },
        DependsOn: { type: 'array', items: { type: 'string' } },
        LastModified: { type: 'integer', minimum: 0 },
        QueuedTimestamp: { type: 'integer', minimum: 0 },
        Seq: { type: 'integer', minimum: 0 },
        Status: { type: 'string', enum: ['pending', 'queued', 'running', 'completed', 'failed'] },
        TTL: { type: 'integer', minimum: 0 },
      },
      required: [
        'Command',
        'Seq',
        'Status',
        'TTL',
      ],
    },
  },
};
