'use strict';

const Io = require('../src/index');

describe('The Io object', function() {
  it('Can return static values', function(done) {
    Io.of(5).run().then(function(result) {
      expect(result).toBe(5);
    }).then(done).catch(done.fail);
  });

  it('can be applied according to the fantasyland applicative specification', function(done) {
    //TODO read this specification carefully.
    Io.of(function(x) { return x*2; }).ap(Io.of(5)).run().then(function(result) {
      expect(result).toBe(10);
    }).then(done).catch(done.fail);
  });

  it('can be chained according to the fantasyland monad specification', function(done) {
    //TODO read this specification carefully.
    Io.of(5).chain(function(x) {
      return Io.of(x*2);
    }).run().then(function(result) {
      expect(result).toBe(10);
    }).then(done).catch(done.fail);
  });

  it('can be chained by passing in a raw Io', function(done) {
    Io.of(5).chain(Io.of('ten')).run().then(function(result) {
      expect(result).toBe('ten');
    }).then(done).catch(done.fail);
  });

  it('can be chained by a function that returns a value', function(done) {
    Io.of(5).chain(function(five) {
      return five+five;
    }).run().then(function(result) {
      expect(result).toBe(10);
    }).then(done).catch(done.fail);
  });

  it('can be chained by a function that returns a promise', function(done) {
    Io.get().chain(function(five) {
      return Promise.resolve(five+five).then(function(result) { return result*2; });
    }).run(5).then(function(result) {
      expect(result).toBe(20);
    }).then(done).catch(done.fail);
  });

  it("can be chained by a function that is also an Io (giving preference to the function's nature as an Io).", function(done) {
    const action = Object.assign(() => { throw Error("don't call me"); }, Io.prototype, Io.of().chain(() => 'hello, world'));

    expect(typeof action).toBe('function');
    expect(Io.isIo(action)).toBe(true);
    
    Io.get().chain(action).run('goodbye, world').then(result => {
      expect(result).toBe('hello, world');
    }).then(done).catch(done.fail);
  });

  it('can get an embedded state', function(done) {
    Io.get().chain(function(x) { return x+2; }).run(5).then(function(result) {
      expect(result).toBe(7);
    }).then(done).catch(done.fail);
  });

  it('can get an embedded state even when nested', function(done) {
    function foo(x) {
      return Io.get().chain(function(y) { return Promise.resolve(x+y); });
    }

    foo(5).chain(foo(6)).run(2).then(function(result) {
      expect(result).toBe(8);
    }).then(done).catch(done.fail);
  });

  it('can catch a failure condition, using catch()', function(done) {
    Io.of().chain(() => {
      throw 'intentional failure';
    }).chain(() => {
      done.fail('unexpected success');
    }).catch(x => {
      expect(x).toBe('intentional failure');
    }).run()
      .then(done).catch(done.fail);
  });

  it('can not catch successful results, using catch()', function(done) {
    Io.of().chain(() => {
      return 'success';
    }).catch(x => {
      done.fail('saw: ' + x);
    }).run().then(done).catch(done.fail);
  });

  it('can be executed multiple times with different outcomes', function(done) {
    const io = Io.get().chain(function(x) {
      return x.toUpperCase();
    });

    const results = [io.run('foo'), io.run('bar'), io.run('baz'), io.run('quux')];

    Promise.all(results).then(function(values) {
      expect(values).toEqual(['FOO','BAR','BAZ','QUUX']);
    }).then(done).catch(done.fail);
  });

  it('supports local modifications to the embedded state', function(done) {
    const action = Io.get().chain(function(x) { return x; });

    Io.local(function(x) { return x*2; }, action).run(3).then(function(result) {
      expect(result).toEqual(6);
    }).then(done).catch(done.fail);
  });

  it('supports using Ios to implement the local modification function', function(done) {
    const modification = x => Io.of(x*2);
    const action = Io.get().chain(function(x) { return x; });

    Io.local(modification, action).run(3).then(function(result) {
      expect(result).toEqual(6);
    }).then(done).catch(done.fail);
  });

  it('supports local modifications to the embedded state, even in fluent style', function(done) {
    let side_effect = false;

    Io.of()
      .chain(function() { side_effect = true; })
      .local(x => x+1, Io.get())
      .run(0)
      .then(function(result) {
        expect(result).toEqual(1);
        expect(side_effect).toBe(true);
      }).then(done).catch(done.fail);
  });

  it('can be unwrapped to get a function that takes the embedded state and returns a promise', function(done) {
    const action = Io.of(5).chain(function(x) { return Io.get().chain(function(y) { return x+y; }); });

    action.unwrap()(9).then(function(result) {
      expect(result).toBe(14);
    }).then(done).catch(done.fail);
  });

  it('supports parallel execution', function(done) {
    const foo = x => Io.get().chain(y => x + y);

    Io.parallel([foo(1),foo(2),foo(3)]).run(7).then(result => {
      expect(result[0]).toBe(8);
      expect(result).toEqual([8,9,10]);
      expect(Array.isArray(result)).toBe(true);
    }).then(done).catch(done.fail);
  });

  it('supports parallel execution with named threads', function(done) {
    const foo = x => Io.get().chain(y => x + y);

    Io.parallel({foo:foo(5),bar:foo(0),baz:foo(1)}).run(2).then(result => {
      expect(result.foo).toBe(7);
      expect(result.bar).toBe(2);
      expect(result.baz).toBe(3);
      expect(Array.isArray(result)).toBe(false);
    }).then(done).catch(done.fail);
  });

  it('supports sequential execution', function(done) {
    let count = 0;
    const foo = (x) => Io.of().chain(() => {
      expect(count).toBe(x);
      count++;
      return count;
    });

    Io.sequence([foo(0),foo(1),foo(2),foo(3)]).run(2).then(result => {
      expect(result).toEqual([1,2,3,4]);
      expect(count).toBe(4);
      expect(Array.isArray(result)).toBe(true);
    }).then(done).catch(done.fail);
  });

  it('supports sequential execution with named threads', function(done) {
    let count = 0;
    const foo = (x) => Io.of().chain(() => {
      expect(count).toBe(x);
      count++;
      return count;
    });

    Io.sequence([foo(0),foo(1),foo(2),foo(3)]).run(2).then(result => {
      expect(result).toEqual([1,2,3,4]);
      expect(count).toBe(4);
      expect(Array.isArray(result)).toBe(true);
    }).then(done).catch(done.fail);
  });
});
