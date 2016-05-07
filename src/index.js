
var Io = {
  _action : function() { throw Error('Io undefined action.'); }
};

function isIo(value) {
  return typeof value === 'object' && Object.getPrototypeOf(value) === Io;
}

Io.of = function(value) {
  return Object.assign(Object.create(Io), {
    _action : function() {
      return Promise.resolve(value);
    }
  });
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
    return Promise.resolve(f(v));
  });
};

Io.ap = function(v) {
  return this.chain(function(f) { return v.map(f); });
};

Io.chain = function(f) {
  var previous_io = this;

  return Object.assign(Object.create(Io), {
    _action : function(state) {
      return previous_io.run(state).then(function(result) {
        result = typeof f === 'function' ? f.call(state,result) : f;
        if( isIo(result) )
          result = result.run(state);
        return Promise.resolve(result);
      });
    }
  });
};

Io.local = function(modification, action) {
  if( isIo(this) )
    return this.chain(Io.local(modification, action));

  return Io.get().chain(function(state) {
    var local_state = modification(state);

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
module.exports.get = Io.get;
module.exports.local = Io.local;
module.exports.isIo = isIo;
module.exports.prototype = Io;

