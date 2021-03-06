
[![Build Status](https://travis-ci.org/lane-webperformance/legion-io.svg?branch=master)](https://travis-ci.org/lane-webperformance/legion-io)
[![Dependency Status](https://gemnasium.com/badges/github.com/lane-webperformance/legion-io.svg)](https://gemnasium.com/github.com/lane-webperformance/legion-io)

An Io is a
[fantasyland](https://github.com/fantasyland/fantasy-land) monad carrying an
internal state and bound via promises. In common parlance, that means you
chain it, like this:

	var Io = require('legion-io');

	Io.of('hello')
	  .chain(function(x) { return x+' world'; })
	  .chain(function(x) { console.log(x); })
	  .run(); // prints 'hello world'

It also means you can pass a parameter in as the carried state, like this:

	Io.get()
	  .chain(function(x) { return x+' world'; })
	  .chain(function(x) { console.log(x); })
	  .run('hello'); // prints 'hello world'

Additionally, the result of run() is a promise, so you could move the side
effect outside of the chain, like this:

	Io.get()
	  .chain(function(x) { return x+' world'; })
	  .run('hello')
	  .then(function(x) { console.log(x); }); //prints 'hello world'

All of the above code snippets should have the exact same behavior.

Ios are used in Legion as composable units of testcase construction.
For example, an Io might be a section of work that has been instrumented
to measure the amount of time it takes, a separate 'thread' of execution
within a larger testcase, or an entire testcase, or even the root element
of a group of testcases forming an entire load test.

Reference
---------

### Io.isIo(something)

Answers true if the parameter is an Io.

### Io.of(value)

An Io that simply returns the given value. In this case, 'returns' means that
the value will be passed into the next Io in the chain, or returned by the
run() method if there are no more chains.

### Io.get()

An Io that simply returns the carried state. This state is either the value
that was passed into the run() method, or a local value from a caller's
local() invocation.

### Io.prototype.map(f)

An Io is a fantasyland functor.

### Io.prototype.ap(v)

An Io is a fantasyland applicative.

### Io.prototype.chain(f)

An Io is a fantasyland chainable (and a monad).

In addition, the fantasyland specification leaves some room for undefined
behavior that we exploit. A chained method can return:

* An ordinary Javascript value, which will be wrapped into a promise using
Promise.resolve().
* A Promise (or thenable), which also passes through Promise.resolve().
* An Io.

### Io.prototype.local(modification, action)

Make a local modification to the carried state for the duration of a critical
section. This modification is then dropped at the end of the critical section.

* modification: a function to return a modified copy of the carried state.
* action: a critical section, which may be any value that is valid for
Io.chain().

### Io.prototype.localPath(path, modification, action)

Make a local modification to the carried state for the duration of a critical
section. This modification is then dropped at the end of the critical section.

* path: a path into the state, for example, ['services','metrics']
* modification: a function to return a modified copy of the fragment of carried state at the specified path
* action: a critical section, which may be any value that is valid for Io.chain()

### IO.prototype.run(state)

Begin execution of an Io. The result will always be a promise, which in turn
should contain the result of the last step in the chain.

### Io.resolve(value)

Analogous to Promise.resolve(), but wrapping a value in an Io if it is not
already wrapped in an Io. (Io.of() cannot do this, because it must be possible
to wrap an Io in another Io.) You usually shouldn't need this.
