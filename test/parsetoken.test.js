var assert = require('assert');

var parsetoken = parsetoken || require('../prepcook.token');

describe('Parse Token Module', function() {
	describe('Parse', function() {
		var templates = {
			basic: '<html><body>Hello World</body></html>',
			literal: '["Hello World"]',
			literal_with_space: '["Hello World"] ',
			literal_filter_lowercase: '["Hello World"|lowercase]',
			variable: '[foo]',
			object_notation: '[bar.baz]',
			object_nested: '[baz]',
			object_nested_deep: '[d]',
			object_nested_deep_filter: '[d|uppercase] [e]'
		};



		var data = {
				foo: 'fubar',
				bar: {baz: 'hi there'},
				a: {b: {c: {d: 'Deep impact!', e: 'Another One'}}}
			},
			eval_delimeter_call = [
				{
					left: '[',
					right: ']', 
					callback: parsetoken.evalCommandBlock
				}
			];

		it ('Should Parse string with no tokens.', function() {
			var result = parsetoken.parse(templates.basic, {}, eval_delimeter_call); 
			assert.equal(templates.basic, result);
		});

		it ('Should Parse string with token literal.', function() {
			var result = parsetoken.parse(templates.literal, {}, eval_delimeter_call);
			assert.equal('Hello World', result);
		});

		it ('Should trim space outside of token.', function() {
			var result = parsetoken.parse(templates.literal_with_space, {}, eval_delimeter_call);
			assert.equal('Hello World', result);
		});

		it ('Should execute lowercase filter.', function() {
			var result = parsetoken.parse(templates.literal_filter_lowercase, {}, eval_delimeter_call);
			assert.equal('hello world', result);
		});

		it ('Should evaluate a variable.', function() {
			var result = parsetoken.parse(templates.variable, {foo: 'bar'}, eval_delimeter_call, '');
			assert.equal('bar', result);
		});

		it ('Should evaluate an object path.', function() {
			var result = parsetoken.parse(templates.object_notation, data, eval_delimeter_call, '');
			assert.equal('hi there', result);
		});

		it ('Should evaluate an object by relative path.', function() {
			var result = parsetoken.parse(templates.object_nested, data, eval_delimeter_call, 'bar');
			assert.equal('hi there', result);
		});

		it ('Should evaluate an object by a deep relative path.', function() {
			var result = parsetoken.parse(templates.object_nested_deep, data, eval_delimeter_call, 'a.b.c');
			assert.equal('Deep impact!', result);
		});

		it ('Should evaluate multiple statements', function() {
			var result = parsetoken.parse(templates.object_nested_deep_filter, data, eval_delimeter_call, 'a.b.c');
			assert.equal('DEEP IMPACT!Another One', result);
		});
	});
});