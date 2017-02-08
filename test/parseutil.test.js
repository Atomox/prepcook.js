var assert = require('assert');
const BISTRO_FAILURE = BISTRO_FAILURE || '__FAILURE';

var parseutil = parseutil || require('../includes/prepcook.utils');

describe('Parse Utils', function() {
	describe('normalizeExpression()', function() {
		var templates = {
				boolean: 'true',
				number: 1234,
				decimal: 1234.56,
				literal: '"Hello World"',
				literal_mixedcase: "'123 Hello Wor789ld'",
				variable: 'foo',
				object_notation: 'bar.baz'
			}, 
			data = {
				foo: 'fubar',
				bar: {baz: 'hi there'}
			};


		// Expected behavior.
		it ('Should identify a boolean.', function() {
			assert.equal(true, parseutil.normalizeExpression(templates.boolean, data));
		});
		it ('Should identify an integer as a number.', function() {
			assert.equal(templates.number, parseutil.normalizeExpression(templates.number, data));
		});
		it ('Should identify a decimal as a number.', function() {
			assert.equal(templates.decimal, parseutil.normalizeExpression(templates.decimal, data));
		});
		it ('Should identify a literal.', function() {
			assert.equal("Hello World", parseutil.normalizeExpression(templates.literal, data));
		});
		it ('Should identify a mixed literal as a literal.', function() {
			assert.equal("123 Hello Wor789ld", parseutil.normalizeExpression(templates.literal_mixedcase, data));
		});
		it ('Should identify and replace a variable with it\'s value.', function() {
			assert.equal(data.foo, parseutil.normalizeExpression(templates.variable, data));
		});
		it ('Should identify and replace a variable path with it\'s value.', function() {
			assert.equal(data.bar.baz, parseutil.normalizeExpression(templates.object_notation, data));
		});

		// Errors
		it ('Should error if a variable was passed without any data.', function() {
			assert.equal(BISTRO_FAILURE, parseutil.normalizeExpression(templates.object_notation));
		});


		/**
		   @TODO
		 */
		it ('Should error if a variable was not found in the data.');
	});

	describe('firstOccuring()', function() {

		it ('Should return a value when only one exists.', function() {
			assert.equal('#each', parseutil.firstOccuring(['#else', '#each', '#if'], 'hello #each world'));
		});
		it ('Should match the first occuring when two or more exist.', function() {
			assert.equal('#each', parseutil.firstOccuring(['#each', '#elseif', '#if'], 'hello #each #elseif world #else'));
		});

		/**
		   @TODO
		 */
		it ('Should not return #else if #elseif comes first.', function() {
			assert.equal('#elseif', parseutil.firstOccuring(['#else', '#elseif', '#if'], 'hello #elseif world #else'));
		});

		it ('Should return nothing when no match is found.');
	});

	describe('getObjectPath()', function() {

		it ('Should get the value at the passed path.');
		it ('Should return a failure if the path does not exist in the data.');
	});

});