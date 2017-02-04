#prepCook.js

**A simple, promise-based templating engine built in Node.js. 
Developed for [Bistro.js](https://github.com/Atomox/bistro.js).**


Templating based on concepts from handlebars.js and angular.js.


## Requirements:

Make sure to have [bistro.tree.js](https://github.com/Atomox/bistro.js.tree/blob/master/bistro.js.tree.js), the underlying tree data structure we use to process your templates with.


## Using it is simple.

Just require the package's module:

```var prepcook = prepcook || require ('prepcook');```


And run it against a template, with a context:

```var output = prepcook.processTemplate(data, template);```

`processTemplate` returns a [PROMISE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), so it currently is for back-end, ES6 compatable environments. `output` should be "then'ed", where you'll get the actual data, like so:

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
		{{ [message.title|string] }}
	</h1>
	<p>	
		{{ [body|text] }}
	</p>
```

### Conditionals
```
	{{ #if people }} I'm a person, and totally exist. {{ \if }}
	{{ #if person.age >= 2 }} I'm at least 2. {{ \if }}
	{{ #unless person >= 21 }} I'm not 21 yet! {{ \unless }}

```

### Loops
```
	<ul>
		{{ #each people }}
				<li> 
					Here's people.first, and people.last 
					{{ [first|string] [last|string] }}
				</li> 
		{{ /each }}
	</ul>
```

Or nest them.

```
	{{ #each foo }}
		{{ #each bar }}
			<li> {{ [baz|string] }} </li>
		{{ /each
	/each }}
```

### Angular-style Filters:

Inspired by Angular, you can apply filters to your variables or literals before outputting them. The syntax is as follows:

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
