'use strict';

const R = require('ramda');

const Io = {
  _action : function() { throw Error('Io undefined action.'); },
  _type : 'legion-io/Io'
};

function isIo(value) {
  return typeof value === 'object' && Object.getPrototypeOf(value)._type === Io._type;
}

function of(value) {
  return Object.assign(Object.create(Io), {
    _action : function() {
      return Promise.resolve(value);
    }
  });
}

function resolve(value) {
  if( isIo(value) )
    return value;

  return of(value);
}

function get(path) {
  path = R.lensPath(path || []);

  return Object.assign(Object.create(Io), {
    _action : function(state) {
      return Promise.resolve(state).then(s => R.view(path,s));
    }
  });
}

Io.map = function(f) {
  return this.chain(function(v) {
    return of(f(v));
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
                 .then(resolve)
                 .then(io => io.run(state));
    }
  });
};

Io.catch = function(f) {
  return Object.assign(Object.create(Io), this, {
    _action : state => {
      return Promise.resolve()
               .then(() => this.run(state))
               .catch(x => of(x).chain(f).run(state));
    }
  });
};

Io.local = function(modification, action) {
  if( isIo(this) )
    return this.chain(Io.local(modification,action));

  return Io.localPath([], modification, action);
};

Io.localPath = function(path, modification, action) {
  if( isIo(this) )
    return this.chain(Io.localPath(path, modification, action));

  path = R.lensPath(path);

  return get().chain(function(state) {
    const local_state = R.over(path, modification, state);

    return of().chain(action).run(local_state);
  });
};

Io.unwrap = function() {
  return this.run.bind(this);
};

Io.run = function(state) {
  return this._action.call(undefined, state);
};

module.exports.of = of;
module.exports.resolve = resolve;
module.exports.get = get;
module.exports.local = Io.local;
module.exports.localPath = Io.localPath;
module.exports.isIo = isIo;
module.exports.prototype = Io;

