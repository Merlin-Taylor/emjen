# emjen

[![Build Status](https://travis-ci.org/Merlin-Taylor/emjen.svg?branch=master)](https://travis-ci.org/Merlin-Taylor/emjen)

# Description
Environment Manager Job ENgine is a library that provides durable workflow support using DynamoDB and SQS and comprises orchestrator and worker modules.

# Installation
1. Create the AWS resources the library will use at runtime.
1. Install the library.

# Usage
1. Start a worker.
    ```
    let AWS = require('aws-sdk);
    let emjen = require('emjen');
    let commands = {
        'echo/v1': ({ Args: { Message } }, { sendToReplyQueue }) =>     sendToReplyQueue({ Result: Message, Status: completed, Type: TaskCompleted }),
    };
    let inboundQueue = 'https://sqs.eu-west-1.amazonaws.com/123456789012/worker-queue'
    // Start the worker
    let worker = emjen.worker({ commands, inboundQueue, queueClient: emjen.sqsQueueClient(new AWS.SQS()) });
    // Stop the worker
    let stopped = worker.stop();
    // Do something after the worker has stopped
    stopped.then(() => ...)
    ```
1. Start an orchestrator.
    ```
    let emjen = require('emjen');
    let inboundQueue = 'https://sqs.eu-west-1.amazonaws.com/123456789012/orchestrator-queue'
    let stateTable = 'emjen-jobs'
    let workQueue = 'https://sqs.eu-west-1.amazonaws.com/123456789012/worker-queue'
    // Start the orchestrator
    let orchestrator = emjen.orchestrator({
        inboundQueue,
        queueClient: emjen.sqsQueueClient(new AWS.SQS())
        stateTable,
        tableClient: emjen.dynamoTableClient(new AWS.DynamoDB.DocumentClient())
        workQueue
    });
    // Stop the orchestrator
    let stopped = orchestrator.stop();
    // Do something after the orchestrator has stopped
    stopped.then(() => ...)
    ```
1. Submit a job
    ```
    let startTime = Date.now();
    let job = {
        Type: 'NewJob',
        Job: {
            JobId: '1',
            Status: 'active',
            Tasks: {
                EchoHello1: {
                    Params: { Message: 'Hello' },
                    Command: 'echo/v1',
                    LastModified: startTime,
                    Seq: 0,
                    Status: 'pending',
                    TTL: 10000,
                },
                EchoWorld2: {
                    Params: { Message: { $ref: '/EchoHello1/Result' } },
                    Command: 'echo/v1',
                    LastModified: startTime,
                    Seq: 0,
                    Status: 'pending',
                    TTL: 20000,
                },
            },
        },
    };
    orchestrator.submit(job).then(() => console.log('job submitted'));
    ```
