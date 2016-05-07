
var Io = require('../src/index');

describe('The Io object', function() {
  it('Can return static values', function(done) {
    Io.of(5).run().then(function(result) {
      expect(result).toBe(5);
      done();
    });
  });

  it('can be applied according to the fantasyland applicative specification', function(done) {
    //TODO read this specification carefully.
    Io.of(function(x) { return x*2; }).ap(Io.of(5)).run().then(function(result) {
      expect(result).toBe(10);
      done();
    });
  });

  it('can be chained according to the fantasyland monad specification', function(done) {
    //TODO read this specification carefully.
    Io.of(5).chain(function(x) {
      return Io.of(x*2);
    }).run().then(function(result) {
      expect(result).toBe(10);
      done();
    });
  });

  it('can be chained by passing in a raw Io', function(done) {
    Io.of(5).chain(Io.of('ten')).run().then(function(result) {
      expect(result).toBe('ten');
      done();
    });
  });

  it('can be chained by a function that returns a value', function(done) {
    Io.of(5).chain(function(five) {
      return five+five;
    }).run().then(function(result) {
      expect(result).toBe(10);
      done();
    });
  });

  it('can be chained by a function that returns a promise', function(done) {
    Io.get().chain(function(five) {
      return Promise.resolve(five+five).then(function(result) { return result*2; });
    }).run(5).then(function(result) {
      expect(result).toBe(20);
      done();
    });
  });

  it('can get an embedded state', function(done) {
    Io.get().chain(function(x) { return x+2; }).run(5).then(function(result) {
      expect(result).toBe(7);
      done();
    });
  });

  it('can get an embedded state even when nested', function(done) {
    function foo(x) {
      return Io.get().chain(function(y) { return Promise.resolve(x+y); });
    }

    foo(5).chain(foo(6)).run(2).then(function(result) {
      expect(result).toBe(8);
      done();
    });
  });

  it('can not get an embedded state in a problematic fluent style', function(done) {
    Io.of()
      .chain(function() { done.fail('this is the thing we don\'t want to happen'); } )
      .get().chain(function(x) { return Promise.resolve(x*2); })
      .run(7).then(function(result) {
        expect(result).toBe(14);
        done();
      }, function(err) {
        done.fail(err);
      });
  });

  it('can not insert a working value, using of(), in a problematic fluent style', function(done) {
    Io.of().chain(function() { done.fail('this is the thing we don\'t want to happen'); })
      .of(5).chain(function(x) {
        expect(x).toBe(5);
        done();
      }).run().catch(function(err) {
        done.fail(err);
      });
  });

  it('can be executed multiple times with different outcomes', function(done) {
    var io = Io.get().chain(function(x) {
      return x.toUpperCase();
    });

    var results = [io.run('foo'), io.run('bar'), io.run('baz'), io.run('quux')];

    Promise.all(results).then(function(values) {
      expect(values).toEqual(['FOO','BAR','BAZ','QUUX']);
      done();
    });
  });

  it('supports local modifications to the embedded state', function(done) {
    var action = Io.get().chain(function(x) { return x; });

    Io.local(function(x) { return x*2; }, action).run(3).then(function(result) {
      expect(result).toEqual(6);
      done();
    }, function(err) {
      done.fail(err);
    });
  });

  it('supports local modifications to the embedded state, even in fluent style', function(done) {
    var side_effect = false;

    Io.of()
      .chain(function() { side_effect = true; })
      .local(function(x) { return x+1; }, Io.get())
      .run(0)
      .then(function(result) {
        expect(result).toEqual(1);
        expect(side_effect).toBe(true);
        done();
      }, function(err) {
        done.fail(err);
      });
  });

  it('can be unwrapped to get a function that takes the embedded state and returns a promise', function(done) {
    var action = Io.of(5).chain(function(x) { return Io.get().chain(function(y) { return x+y; }); });

    action.unwrap()(9).then(function(result) {
      expect(result).toBe(14);
      done();
    }, function(err) {
      done.fail(err);
    });
  });
});
