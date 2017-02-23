#prepCook.js

**A simple, promise-based templating engine built in Node.js. 
Developed for [Bistro.js](https://github.com/Atomox/bistro.js).**


Templating based on concepts from handlebars.js and angular.js.

[![Build Status](https://travis-ci.org/Atomox/prepcook.js.svg?branch=master)](https://travis-ci.org/Atomox/prepcook.js)

## Updates: 
0.4.0
* We heard you like templates. Now you can put a [template inside your template](https://github.com/Atomox/prepcook.js/issues/3), using **`#template`**.
  * Pass your own scope variable, or maintain the current scope/data from the place/time it's called.
* Travarse up the scope chain for a var using: **`../`**, like `../../foo.bar`. (Finds foo.bar starting two levels up.)
* More "async" handling of template evaluation. Not really, but lots of promises.
* New tests.


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
Loop over the elements of an array, easily.

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

*Object looping is not currently supported, but [it's coming](https://github.com/Atomox/prepcook.js/issues/9).*


### Change Scope
You can easily change the scope of your template object. Just prepend any variable with **`../`**

```
// Our data:
{
	foo: {
		bar: {	a: 'Hi there' },
		baz: {	a: 'Winter is Coming' }
	}
}
```

```
// Our Template
{{ #each foo.bar }}
	// Hi there
	{{ [a] }}

	// Winter is coming
	{{ [../baz.a] }}
{{ /each }}
```

You can use it once, or chain them, just like in any shell (like BASH or DOS). But please, no spaces. And keep them to the start of an expression.

These are OK: `../../../foo.bar`, `../foo`, `../bar.baz`. This is not: `foo../bar`. But you wouldn't do that.


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


### Nest templates:
Reference one template inside another:

```
	{{#template template_ref_name}}
```

Setup just requires binding the templates before you render the master template:

```
// The template data you were gonna render anyway.
var kingdom_template = '<h1>Welcome to the {{[location]}}</h1>, but {{ #template another_castle_tpl /template }}';
var kingdom_data = { name: 'Mario', location: 'Mushroom Kingdom', other: 'castle'};

// Your nested template.
var castle_tpl = "Your princess is in {{ [other] }}";

// Attach a nested template.
prepcook.bindSubTemplate(kingdom_data, 'another_castle_tpl', castle_tpl);
```

```
// Then render the main template as normal, using the master_data as you data variable.
var output = prepcook.processTemplate(kingdom_data, kingdom_template);

```
That's it!


Want to pass data just for your nested template? Maybe header or footer data? No problem!
```
var castle_data = { other: 'castle' };  // This one's optional!

// Attach it like before.
prepcook.bindSubTemplate(kingdom_data, 'another_castle_tpl', castle_tpl, castle_data);
```

Passed data at binding time always takes precidence. Otherwise, the master template's data will be assumed.
When you rely on the default data, we'll pass it to your template with it's current scope.

E.G. If you #template is referenced when the parent template's scope is at: 'foo.bar', then your template will start at the same scope, foo.bar.
/(Remember, you can always use '../' to get higher in the scope.)/

```
// Master template
{{ #each people }}
	{{ #template my_person_tpl /template }}
{{ /each }}

// Sub template 'my_person_tpl'

<p> // This references each element of people in the master template.
	{{ [first_name] }} {{ [last_name] }}
}
</p>
```

But, if you bind your own template's data, then it will refer to that data, even if it has the same name.



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
1. `#each` should be able to view data outside of it's scope, using `../`
	a. Instead of passing the object subtree to #each, we should pass the original object, and a current path string. Think PWD in BASH.
2. Can we add an #async or #lazy command, which loads it's subtree after passing to the browser? It could set proper placeholders/ids, and attach the approprate JS along with the template in order to facilitate AJAX calls when the page loads.
3. Performance check.

## Updates: 
0.4.0
* We heard you like templates. Now you can put a [template inside your template](https://github.com/Atomox/prepcook.js/issues/3).
  * Pass your own scope variable, or maintain the current scope/data from the place/time it's called.
* Travarse up the scope chain for a var using: ../, like `../../foo.bar`. (Finds foo.bar starting two directories up.)
* More "async" handling of template evaluation. Not really, but lots of promises.
* New tests.

0.3.0
* npm install from scratch now working after [initial dependencies issues](https://github.com/Atomox/prepcook.js/issues/4).
* CI integration with Travis. 
* Implode Filter for quick concat of simple arrays.
* [Better abstraction](https://github.com/Atomox/prepcook.js/issues/5) of global consts.
