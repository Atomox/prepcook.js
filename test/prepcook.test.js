var assert = require('assert');

var prepcook = prepcook || require('../prepcook');

describe('Prepcook Module', function() {
	describe('Parse', function() {
		var templates = {
			basic: '<html><body>Hello World</body></html>',
			literal: '<html><body>{{ ["Hello World"] }}</body</html>',
			literal_filter_lowercase: '<html><body> {{ ["Hello World"|lowercase] }} </body></html>',
			if_true: '{{ #if true }}This is True{{ /if }}',
			if_false: '{{ #if false }}This is not True{{ /if }}',
			if_else_true: '{{ #if true }}This is True{{ #else }} NOT {{ /else }}',
			if_else_false: '{{ #if false }}This is not True{{ #else }} NOT {{ /else }}',
			if_elif_else: '{{ #if a }}A{{#elif b}}B{{ #else }}C{{ /else }}',
			object_notation: '[bar.baz]'
		};



		var data = {
			foo: 'fubar',
			bar: {baz: 'hi there'},
			a: true,
			b: true,
			c: true
		};

		// Promises & Bad Data

		it ('Should return a promise.');
		it ('Should error if a template was not a string.');

		it ('Should parse plain templates.', function() {
			return prepcook.processTemplate({}, templates.basic)
				.then(function(tpl) { 
					assert.equal(tpl, templates.basic); });
		});

		// Simple Templates

		it ('Should parse simple templates.', function() {
			return prepcook.processTemplate({}, templates.literal)
				.then(function(tpl) { 
					assert.equal("<html><body>Hello World</body</html>", tpl); });
		});

		// Single Response
		it ('Should return the same data on every request.');

		

		// Conditionals

		it ('Should parse simple conditionals, and display them if true.', function() {
			return prepcook.processTemplate({}, templates.if_true)
				.then(function(tpl) { 
					assert.equal("This is True", tpl); });
		});

		it ('Should parse simple conditionals, and not display them if false.', function() {
			return prepcook.processTemplate([], templates.if_false)
				.then(function(tpl) { 
					assert.equal("", tpl); });
		});

		it ('Should parse linked conditionals, and not display ELSE when if true.', function() {
			return prepcook.processTemplate({}, templates.if_else_true)
				.then(function(tpl) { 
					assert.equal("This is True", tpl); });
		});

		it ('Should parse linked conditionals, and not display ELSE instead of IF when false.', function() {
			return prepcook.processTemplate({}, templates.if_else_false)
				.then(function(tpl) { 
					assert.equal("NOT", tpl); });
		});

		it ('Should parse multi-linked conditionals, and not display ELIF or ELSE when IF is true.', function() {
			return prepcook.processTemplate({a: true, b: true, c: true}, templates.if_elif_else)
				.then(function(tpl) { 
					assert.equal("A", tpl); });
		});

		it ('Should parse multi-linked conditionals, and not display IF or ELSE when IF is false, and elif is true.', function() {
			return prepcook.processTemplate({a: false, b: true, c: true}, templates.if_elif_else)
				.then(function(tpl) { 
					assert.equal("B", tpl); });
		});

		it ('Should parse multi-linked conditionals, and not display IF or ELIF when they are false.', function() {
			return prepcook.processTemplate({a: false, b: false, c: true}, templates.if_elif_else)
				.then(function(tpl) { 
					assert.equal("C", tpl); });
		});
		
	});
});