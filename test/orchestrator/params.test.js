

require('should');
const { getTaskDependencies, evaluateParams } = require('../../lib/orchestrator/params');

describe('orchestrator/params', () => {
  describe('getTaskDependencies', () => {
    it('returns the task dependencies from the params', () => {
      getTaskDependencies({ a: { $ref: '/a/Result/b' }, b: 'literal' }).should.eql(['a']);
    });
  });
  describe('evaluateParams', () => {
    it('converts refs to values', () => {
      evaluateParams({ a: { $ref: '/task/Result/b' }, b: 'literal' }, { task: { Result: { b: 1 } } }).should.eql({ a: 1, b: 'literal' });
    });
  });
});
