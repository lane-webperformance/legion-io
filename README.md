
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
### Io.prototype.of(value)

An Io that simply returns the given value. In this case, 'returns' means that
the value will be passed into the next Io in the chain, or returned by the
run() method.

### Io.get()
### Io.prototype.get()

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
to Io.chain().

