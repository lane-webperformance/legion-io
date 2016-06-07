
const Io = require('../src/index');

// Io supports a few different ways to return from a function.
// This test randomly varies between them 1,000,000 times in an error
// to trip up the evaluator. Because we can. And we should.

describe('The Io evaluator', function() {
  it('can successfully chain a random sequence of 10,000 calls', function(done) {
    const subtractOne = function(x) {
      const k = Math.floor(Math.random()*4);

      if( k === 0 ) //return the raw value
        return x-1;

      if( k === 1 ) //return the raw value wrapped in a promise
        return Promise.resolve(x-1);

      if( k === 2 ) //return the raw value wrapped in an Io
        return Io.of(x-1);

      if( k === 3 ) //return a computation that will do the thing
        return Io.of(x).chain(subtractOne);

      throw new Error('unreachable code');
    };

    let subtractTenThousand = Io.of(10000);

    for( let i = 0; i < 10000; i++ )
      subtractTenThousand = subtractTenThousand.chain(subtractOne);

    subtractTenThousand.run(null).then(result => {
      expect(result).toBe(0);
      done();
    }).catch(done.fail);
  });
});
