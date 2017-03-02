#prepCook.js

**A simple, promise-based templating engine built in Node.js. 
Developed for [Bistro.js](https://github.com/Atomox/bistro.js).**


Templating based on concepts from handlebars.js and angular.js.

[![Build Status](https://travis-ci.org/Atomox/prepcook.js.svg?branch=master)](https://travis-ci.org/Atomox/prepcook.js)

## Updates: 
0.4.x
* We heard you like templates. Now you can put a [template inside your template](https://github.com/Atomox/prepcook.js/issues/3). Just call, **`#template`**. You even have multiple scope options.
  * [Resolve `#templates` at run-time](https://github.com/Atomox/prepcook.js/issues/12) by binding a look-up function with: *`.config()`*
* Include CSS & JS files with **`#include`**.
* Travarse up the scope chain for a var using: **`../`**, like `../../foo.bar`.
* More "async" handling of template evaluation. Not really, but lots of promises.
* New tests + fixed tests.


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
		// An array of person object, with first and last name
		{{ #each people }}
				<li> 
					// Output each person's first & last name.
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
	[../the.money.stuff|currency:USD]
```

Output a variable, formatted in US Dollars.

```
	['I am a String'|lowercase]
```
Output a string in all lowercase. Also try `[string|uppercase]`.


```
	[a_cool_object|JSON]
```
Output a variable in JSON format.



## Includes & Template Nesting


### Includes

Reference css or js files to be included cleanly.

```
	{{#include css|my_file_nickname /include}}
```

Just bind them beforehand: 
```
	prepcook.prepcookBindInclude(master_data, 'my_file_nickname', 'css', 'path/to/file.css');
	prepcook.prepcookBindInclude(master_data, 'my_file_nickname', 'js', 'path/to/file.js');
```
`master_data` refers to the master data for the entire template.
`my_file_nickname` refers to a machine name you'll use to reference your file.
The names must be unique by type (one css named `my_css_one` per template), but you can have the same name for a css and js file.

Include Multiple files in one command:
```
	{{#include 
		css|my_file_nickname 
		css|my_second_file
		css|my_third_file

		js|my_cool_js
		js|another_js_file
	/include}}
```



### Nest templates:

Reference one template inside another:

```
	{{#template template_ref_name /template}}
```

Setup just requires binding the templates before you render the master template:

```
// The template data you were gonna render anyway.
var kingdom_template = '<h1>Welcome to the {{[location]}}</h1>,'
	+ 'but {{ #template another_castle_tpl /template }}';
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


### Resolve template at run-time:

Don't want to preload the template variable ahead of time? No problem! Provide your own template look-up function, 
and we'll call it when we encounter a `#template` we can't resolve.

```
	// Attach our template loader function to the Prepcook vars.
	prepcook.config(master_vars, '#template', your_template_lookup_function);
```

We'll always try to resolve a template's name against a bound template first. When not found, we'll call the function above to try to find the template.

Make sure your function returns a `Promise()`, which resolves in the following format:

```
	resolve({
		template: /path/to.tpl,
		vars: {
			foo: bar,
			a: '123'
		}
	});
```

`vars` is optional. See above to understand context.


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
1. Can we add an #async or #lazy command, which loads it's subtree after passing to the browser? It could set proper placeholders/ids, and attach the approprate JS along with the template in order to facilitate AJAX calls when the page loads.
2. Performance check.



## Updates: 

0.4.4
* Resolved bug where [`#templates` loose their config](https://github.com/Atomox/prepcook.js/issues/13) when they provide their own vars.

0.4.3
* [Resolve `#templates` at run-time](https://github.com/Atomox/prepcook.js/issues/12) by binding a look-up function with: *`.config()`*

0.4.2
* Fixed issues with #includes and binding. Cleanup, better error catching for loops/child iteration.
* Fixed tests for #template.

0.4.1
* Include CSS & JS files with **`#include`**.

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
