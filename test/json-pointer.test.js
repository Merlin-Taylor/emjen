

const should = require('should');
const {
  compile, escape, evaluate, unescape,
} = require('../lib/json-pointer');

describe('json-pointer', () => {
  describe('compile', () => {
    context('when given a valid json pointer', () => {
      const scenarios = [
        ['/', []],
        ['/a', ['a']],
        ['/0', ['0']],
        ['/1/2/3', ['1', '2', '3']],
        ['/~1', ['/']],
        ['/~0', ['~']],
        ['/~01', ['~1']],
      ];
      scenarios.forEach(([arg, result]) => {
        it(`${arg} -> ${result}`, () => {
          compile(arg).should.eql(result);
        });
      });
    });
    context('when given an invalid json pointer', () => {
      const scenarios = [
        ['a'],
        ['a/b'],
        ['/a/'],
        ['//'],
        ['//a'],
      ];
      scenarios.forEach(([arg]) => {
        it(`${arg} is invalid`, () => {
          should(() => compile(arg)).throw(/Invalid JSON pointer:/);
        });
      });
    });
  });
  describe('escape', () => {
    context('is the inverse of unescape', () => {
      const scenarios = ['/~', '~/', '//', '~~'];
      scenarios.forEach((scenario) => {
        it(scenario, () => {
          unescape(escape(scenario)).should.eql(scenario);
        });
      });
    });
  });
  describe('evaluate', () => {
    context('when the document contains the pointer', () => {
      const scenarios = [
        [['/', { a: 1 }], { a: 1 }],
        [['/a', { a: 1 }], 1],
        [['/1', [0, 1]], 1],
        [['/a/0/b', { a: [{ b: 1 }] }], 1],
        [['/a', { a: undefined }], undefined],
      ];
      scenarios.forEach(([args, result]) => {
        it(`it returns fragment ${args} -> ${result}`, () => {
          should(evaluate(...args)).eql(result);
        });
      });
    });
    context('when the document does not contain the pointer', () => {
      const scenarios = [
        [['/a/0', { a: 1 }], undefined],
      ];
      scenarios.forEach(([args, result]) => {
        it(`it returns ${args} -> ${result}`, () => {
          should(evaluate(...args)).eql(result);
        });
      });
    });
  });
  describe('unescape', () => {
    context('is the inverse of escape', () => {
      const scenarios = ['~1~0', '~0~1', '~1~1', '~0~0'];
      scenarios.forEach((scenario) => {
        it(scenario, () => {
          escape(unescape(scenario)).should.eql(scenario);
        });
      });
    });
  });
});
