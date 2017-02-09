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
			object_notation: '[bar.baz]'
		};



		var data = {
				foo: 'fubar',
				bar: {baz: 'hi there'}
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

		it ('Should evaluate a variable.');

		it ('Should evaluate an object path.');

		it ('Should evaluate multiple statements');
	});
});