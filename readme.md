#prepCook.js

**A simple, promise-based templating engine built in Node.js. 
Developed for [Bistro.js](https://github.com/Atomox/bistro.js).**


Templating based on concepts from handlebars.js and angular.js.

[![Build Status](https://travis-ci.org/Atomox/prepcook.js.svg?branch=master)](https://travis-ci.org/Atomox/prepcook.js)

## Updates: 
0.3.0 
* npm install from scratch now working after [initial dependencies issues](https://github.com/Atomox/prepcook.js/issues/4).
* CI integration with Travis. 
* Implode Filter for quick concat of simple arrays.
* [Better abstraction](https://github.com/Atomox/prepcook.js/issues/5) of global consts.

## Using it is simple.
First, ```npm install prepcook.js``` (see [Dependencies](#manual-dependency-setup) if you'd rather do this manually). Then, 

1. Just require the package's module:
  ```var prepcook = prepcook || require ('prepcook');```
2. And run it against a template, with a context:
  ```var output = prepcook.processTemplate(data, template);```
3. `processTemplate` returns a [PROMISE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). (requires ES6 compatable environments) `output` should be "then'ed", where you'll get the actual data, like so:

```
	output.then(function (the_template) {
			// Do something with your template here!
		})
		.catch(function (err){
			// Something went wrong!
		});
```

## The Language

### Simple code, with formatting:


```
	<h1>
		{{ [message.title] }}
	</h1>
	<p>	
		{{ [body] }}
	</p>
```

### Conditionals
```
	{{ #if people }} I'm a person, and totally exist. {{ \if }}
	{{ #if person.age >= 2 }} I'm at least 2. {{ \if }}
	{{ #unless person >= 21 }} I'm not 21 yet! {{ \unless }}

```
Or chain them, as you would in any language.
```
	{{ #if people }}
		I'm a group of people.
	{{ #elif person }}
		I'm one person.
	{{ #else }}
		A girl has no name.
	{{ /else }}
```

### Loops
```
	<ul>
		{{ #each people }}
				<li> 
					Here's people.first, and people.last 
					{{ [first] [last] }}
				</li> 
		{{ /each }}
	</ul>
```

Or nest them.

```
	{{ #each foo }}
		{{ #each bar }}
			<li> {{ [baz] }} </li>
		{{ /each
	/each }}
```

Refer to the *current element in a simple string* array using `[.]`
Assume `var foo = ['foo', 'bar', 'baz'];`

```
	{{ #each foo }}
		Checkout My current element (spoilers: it's a string): 
		{{ [.] }}
	{{ /each }}
```

### Angular-style Filters:

Inspired by Angular, you can apply filters to your variables or literals before outputting them. Just add a pipe `|` to the end of your variable:

```
	[variable_name|filter:arg1:arg2:arg3]
```

Apply `lowercase` or `uppercase` transformations, format them as a `currency`, convert data to `json`, or all sorts of other things.
You can even add your own!


``` 
	[var|currency:USD]
```

Output a variable, formatted in US Dollars.

```
	['I am a String'|lowercase]
```
Output a string in all lowercase. Also try `[string|uppercase]`.


```
	[var|JSON]
```
Output a variable in JSON format.

### Just pass in a context:

Variables get evaluated based upon whatever context object you pass in.  You can only pass one, but you can traverse it yourself. Some functions, like `#each`, traverse them for you.

```
{
	message: {
		title: "Hi Dad Soup"
	},
	body: "ERAUQS SI DLRO WEHT",
	people: [
		{first: 'Alan', last: 'Alda'},
		{first: 'Ben', last: 'Bova'},
		{first: 'Carl', last: 'Sagan'},
		{first: 'Denis', last: 'Hopper'}
	],
	foo: {
		bar: {
			baz: 123
		}
	}
}
```

Reference like follows:

`[foo.bar.baz]` outputs 123. `#each people` exposes [first] inside of it.


## Tests in Mocha

We use Mocha to run tests to make sure the components are working together as expected. Currently, you'll need to install mocha yourself, then run: `npm test` in the prepcook.js directory.


## Manual Dependency Setup
```npm install prepcook.js``` will take care of everything for you. If you'd rather download it yourself, make sure to include these dependencies:
* [bistro.tree.js](https://github.com/Atomox/bistro.js.tree/blob/master/bistro.js.tree.js), the underlying tree data structure we use to process your templates with.
* (DEV) [Mocha](https://www.npmjs.com/package/mocha), for testing.

Dependencies for node generally go in your project, under `/node_modules/[module_name_here]`. See "Loading from 'node_modules' Folders" in the [Node Modules](https://nodejs.org/docs/v0.4.1/api/modules.html) documentation.


## TODO
1. `#each` has no way to access data when iterating over a leaf array/object. Consider changing to #each a AS b syntax.
2. `#each` should be able to view data outside of it's scope, using `../`
	a. Instead of passing the object subtree to #each, we should pass the original object, and a current path string. Think PWD in BASH.
3. We should be able to reference sub-templates inside of our template.
4. We should split up rendering sub-trees asynchroniously.
5. Can we add an #async or #lazy command, which loads it's subtree after passing to the browser? It could set proper placeholders/ids, and attach the approprate JS along with the template in order to facilitate AJAX calls when the page loads.
6. Performance check.