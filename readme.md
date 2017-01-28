#prepCook.js

**A simple templating engine built in Node.js, originally for the Bistro.js CMS.**


Templating based on concepts from handlebars.js and angular.js.


## Using it is simple.

Just require the package's module:

```var prepcook = prepcook || require ('prepcook');```


And run it against a template, with a context:

```var output = prepcook.processTemplate(data, template);```


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

```

### Loops
```
	<ul>
		{{ #each people }}
			{{ #if first != last }}
				<li> {{ [first|string] [last|string] }} </li>
			{{ /if
		/each }}
	</ul>

	#each foo }}
		{{ #each bar }}
			<li> {{ [baz|string] }} </li>
		{{ /each
	/each }}
```


### Just pass in a context:

```{
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
}```


#### Valid template commands:
```
	{{ #if others [others|string] }} The others are real. {{ /if }}
	{{ #if others == true  [others|string]  /if }}
	{{ #if others == people }} Others is People {{ /if }}
	{{ #if others != people }} Others are not people. {{ /if }}	
	{{ #if others >= 2 }}{{ /if }}
	{{ #if others <= 4 }}{{ /if }}
	{{ #if 2 < 4 }} <p>2 < 4</p>	{{ /if }}
	{{ #if 2 != 4 }} <p>2 != 4</p>	{{ /if }}
	{{ #if 2.4 < 4 }} <p>2.4 < 4</p>	{{ /if }}
	{{ #if 2 > 4 }} <p>2 > 4</p>	{{ /if }}
	{{ #if 2 == 2 }} <p>2 == 2</p>	{{ /if }}
	{{ #if foo.bar.baz == 123 }} <p>2 == 2</p>	{{ /if }}
```


## Requirements:

Make sure to have `bistro.tree.js`, the underlying tree data structure we use to process your templates with.