// https://tools.ietf.org/html/rfc6901

const VALID_REGEX = /^\/$|^(?:\/[^/]+)+$/i;

function validateString(pointer) {
  return VALID_REGEX.test(pointer);
}

function escape(token) {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

function unescape(token) {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function compileCore(pointer) {
  return pointer === '/'
    ? []
    : pointer.split('/').map(unescape).slice(1);
}

function compile(pointer) {
  if (typeof pointer === 'string' && validateString(pointer)) {
    return compileCore(pointer);
  }
  throw new Error(`Invalid JSON pointer: ${pointer}`);
}

function validateArray(pointer) {
  return [...pointer].every(token => typeof token === 'string');
}

function validate(pointer) {
  if (typeof pointer === 'string' && validateString(pointer)) {
    return compileCore(pointer);
  } else if (pointer[Symbol.iterator] !== undefined && validateArray(pointer)) {
    return pointer;
  }
  throw new Error(`Invalid JSON pointer: ${pointer}`);
}

function evaluate(pointer, document) {
  function loop(unmatched, fragment) {
    const [head, ...tail] = unmatched;
    if (head === undefined) {
      return fragment;
    }
    return loop(tail, fragment[head]);
  }
  return loop(validate(pointer), document);
}

module.exports = {
  compile,
  escape,
  evaluate,
  unescape,
};
