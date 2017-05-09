'use strict';

const Io = require('../src/index');

describe('The Io object', function() {
  it('Can return static values', function(done) {
    Io.of(5).run().then(function(result) {
      expect(result).toBe(5);
      done();
    }, done.fail);
  });

  it('can be applied according to the fantasyland applicative specification', function(done) {
    //TODO read this specification carefully.
    Io.of(function(x) { return x*2; }).ap(Io.of(5)).run().then(function(result) {
      expect(result).toBe(10);
      done();
    }, done.fail);
  });

  it('can be chained according to the fantasyland monad specification', function(done) {
    //TODO read this specification carefully.
    Io.of(5).chain(function(x) {
      return Io.of(x*2);
    }).run().then(function(result) {
      expect(result).toBe(10);
      done();
    }, done.fail);
  });

  it('can be chained by passing in a raw Io', function(done) {
    Io.of(5).chain(Io.of('ten')).run().then(function(result) {
      expect(result).toBe('ten');
      done();
    }, done.fail);
  });

  it('can be chained by a function that returns a value', function(done) {
    Io.of(5).chain(function(five) {
      return five+five;
    }).run().then(function(result) {
      expect(result).toBe(10);
      done();
    }, done.fail);
  });

  it('can be chained by a function that returns a promise', function(done) {
    Io.get().chain(function(five) {
      return Promise.resolve(five+five).then(function(result) { return result*2; });
    }).run(5).then(function(result) {
      expect(result).toBe(20);
      done();
    }, done.fail);
  });

  it('can get an embedded state', function(done) {
    Io.get().chain(function(x) { return x+2; }).run(5).then(function(result) {
      expect(result).toBe(7);
      done();
    }, done.fail);
  });

  it('can get an embedded state even when nested', function(done) {
    function foo(x) {
      return Io.get().chain(function(y) { return Promise.resolve(x+y); });
    }

    foo(5).chain(foo(6)).run(2).then(function(result) {
      expect(result).toBe(8);
      done();
    }, done.fail);
  });

  it('can catch a failure condition, using catch()', function(done) {
    Io.of().chain(() => {
      throw 'intentional failure';
    }).chain(() => {
      done.fail('unexpected success');
    }).catch(x => {
      expect(x).toBe('intentional failure');
    }).chain(() => {
      done();
    }).run();
  });

  it('can not catch successful results, using catch()', function(done) {
    Io.of().chain(() => {
      return 'success';
    }).catch(x => {
      done.fail('saw: ' + x);
    }).chain(() => {
      done();
    }).run();
  });

  it('can be executed multiple times with different outcomes', function(done) {
    const io = Io.get().chain(function(x) {
      return x.toUpperCase();
    });

    const results = [io.run('foo'), io.run('bar'), io.run('baz'), io.run('quux')];

    Promise.all(results).then(function(values) {
      expect(values).toEqual(['FOO','BAR','BAZ','QUUX']);
      done();
    }, done.fail);
  });

  it('supports local modifications to the embedded state', function(done) {
    const action = Io.get().chain(function(x) { return x; });

    Io.local(function(x) { return x*2; }, action).run(3).then(function(result) {
      expect(result).toEqual(6);
      done();
    }, done.fail);
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
        done();
      }, done.fail);
  });

  it('supports local modification to a path into the embedded state', function(done) {
    Io.localPath(['foo','bar'], x => x+100, Io.get().chain(o => {
      expect(o.foo.bar).toBe(404);
    }).chain(Io.get(['foo','bar'])).chain(x => {
      expect(x).toBe(404);
    })).run({foo:{bar:304}})
      .then(done)
      .catch(done.fail);
  });

  it('can be unwrapped to get a function that takes the embedded state and returns a promise', function(done) {
    const action = Io.of(5).chain(function(x) { return Io.get().chain(function(y) { return x+y; }); });

    action.unwrap()(9).then(function(result) {
      expect(result).toBe(14);
      done();
    }, done.fail);
  });

  it('supports parallel execution', function(done) {
    const foo = x => Io.get().chain(y => x + y);

    Io.all([foo(1),foo(2),foo(3)]).run(7).then(result => {
      expect(result[0]).toBe(8);
      expect(result).toEqual([8,9,10]);
    }).then(done).catch(done.fail);
  });
});
