

const { setTimeout } = require('timers');
const should = require('should');
const forever = require('../lib/forever');

describe('forever', () => {
  const scenarios = [undefined, null, {}, { cancel: 1 }];
  scenarios.forEach((scenario) => {
    it(`it should throw when the cancellation token ${scenario}`, () => {
      should(() => forever(scenario, () => Promise.resolve())).throw();
    });
  });
  it('it should stop when cancelled', () => {
    const ct = { cancel: false };
    const result = forever(ct, () => Promise.resolve());
    ct.cancel = true;
    return result.should.be.fulfilled();
  });
  it('it should resolve to the return value of fn when cancelled', () => {
    const ct = { cancel: false };
    const result = forever(ct, () => 37);
    ct.cancel = true;
    return result.should.finally.eql(37);
  });
  it('it should call fn repeatedly', () => {
    const ct = { cancel: false };
    setTimeout(() => { ct.cancel = true; }, 100);
    const result = forever(ct, i => i + 1, 0);
    return result.should.finally.be.greaterThan(1);
  });
  it('it should be rejected if fn throws', () => {
    const ct = { cancel: false };
    const result = forever(ct, () => { throw new Error('BOOM'); });
    ct.cancel = true;
    return result.should.be.rejected();
  });
});
