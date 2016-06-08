'use strict';

const Io = {
  _action : function() { throw Error('Io undefined action.'); },
  _type : 'legion-io/Io'
};

function isIo(value) {
  return typeof value === 'object' && Object.getPrototypeOf(value)._type === Io._type;
}

Io.of = function(value) {
  return Object.assign(Object.create(Io), {
    _action : function() {
      return Promise.resolve(value);
    }
  });
};

Io.resolve = function(value) {
  if( isIo(value) )
    return value;

  return Io.of(value);
};

Io.get = function() {
  return Object.assign(Object.create(Io), {
    _action : function(state) {
      return Promise.resolve(state);
    }
  });
};

Io.map = function(f) {
  return this.chain(function(v) {
    return Io.of(f(v));
  });
};

Io.ap = function(v) {
  return this.chain(function(f) { return v.map(f); });
};

Io.chain = function(f) {
  const functionize = function(input) {
    if( typeof input === 'function' )
      return (_state, value) => input(value);

    if( isIo(input) )
      return (state, _value) => input.run(state);

    throw Error('Inputs to Io.chain() must be functions or Ios.');
  };

  f = functionize(f);

  return Object.assign(Object.create(Io), this, {
    _action : state => {
      return Promise.resolve()
                 .then(() => this.run(state))
                 .then(value => f.call(undefined, state, value))
                 .then(Io.resolve)
                 .then(io => io.run(state));
    }
  });
};

Io.local = function(modification, action) {
  if( isIo(this) )
    return this.chain(Io.local(modification, action));

  return Io.get().chain(function(state) {
    const local_state = modification(state);

    return Io.of().chain(action).run(local_state);
  });
};

Io.unwrap = function() {
  return this.run.bind(this);
};

Io.run = function(state) {
  return this._action.call(undefined, state);
};

module.exports.of = Io.of;
module.exports.resolve = Io.resolve;
module.exports.get = Io.get;
module.exports.local = Io.local;
module.exports.isIo = isIo;
module.exports.prototype = Io;

