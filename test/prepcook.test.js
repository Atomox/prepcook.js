var assert = require('assert');

var prepcook = prepcook || require('../prepcook');
const constants = require('../prepcook.config');
const BISTRO_FAILURE = constants.BISTRO_FAILURE;

describe('Prepcook Module', function() {
	describe('Config', function() {
		it ('Should define const BISTRO_FAILURE', function() {
			assert.equal('__FAILURE', BISTRO_FAILURE);
		});
	});

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
			each: '{{ #each a }}{{ [b] }}{{/each }}',
			each_string: '{{ #each a }}{{ [.] }}{{/each }}',
			each_nested: '{{ #each people #each name }}{{[.]}}{{ /each /each }}',
			object_notation: '[bar.baz]',
			complex: '{{ #each a }}{{ [.] }}{{/each }}' + '{{ #if a }}A{{#elif b}}B{{ #else }}C{{ /else }}',
			nested_template: '{{ [bar.baz] }} {{ #template my_temp /template }} {{[foo|uppercase]}}',
			nested_template_b: '{{ [bar.baz] }} {{ #template my_other_temp /template }} {{[foo|uppercase]}}',
			nested_template_c: '{{ [bar.baz] }} {{ #template my_temp /template }} {{ #template my_other_temp /template }} {{[foo|uppercase]}}',
			nested_template_d: '{{ [bar.baz] }} {{ #each one #each two }} {{ #template my_third_template /template }} {{ /each /each }} {{[foo|uppercase]}}',
			nested_path_template: '{{[a]}} {{ [b|lowercase]}} {{[c]}}',
			include_css: 		'{{[x]}}{{[y]}}{{#include css:my_style /include}} {{[z]}}',
			include_js: 		'{{[x]}}{{[y]}}{{#include js:my_script /include}} {{[z]}}',
			include_multiple: 	'{{[x]}}{{[y]}}{{#include css:my_style js:my_script /include}} {{[z]}}',
			include_multiple_whitespace: `{{[x]}}{{[y]}}
				{{#include
					css:my_style

					js:my_script 
				/include}} {{[z]}}`
		};

		var data = {
			foo: 'fubar',
			bar: {baz: 'hi there'},
			people: [
				{name: ['a', 'b','c'] },
				{name: ['d', 'e', 'f'] },
				{name: ['g', 'h', 'i'] }
			],
			a: true,
			b: true,
			c: true,
			x: 'X',
			y: 'Y', 
			z: 'Z',
			one: [{
				two: [{
					a: 'A',
					b: 'B',
					c: 'C'
				}]
			}],
			__prepcook:{
				templates: {
					my_temp: {
						template: templates.if_elif_else + '{{[foo]}}',
						vars: {
							foo: 'foobar',
							bar: {baz: 'hi there'},
							people: [
								{name: ['a', 'b','c'] },
								{name: ['d', 'e', 'f'] },
								{name: ['g', 'h', 'i'] }
							],
							a: false,
							b: true,
							c: true,
						}
					},
					my_other_temp: {
						template: templates.if_elif_else + '{{[foo]}}'
					},
					my_third_template: {
						template: templates.nested_path_template
					}
				},
				css: {
					my_style: {
						path: '123/abc.css'
					}
				},
				js: {
					my_script: {
						path: '789/xyz.js'
					}
				}
			}
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


		it ('Should return all elements in #each.', function() {
			return prepcook.processTemplate({a: [{b: 'abc'}, {b: 'bcd'}, {b: 'cde'}]}, templates.each)
				.then(function(tpl) { 
					assert.equal("abcbcdcde", tpl); });
		});

		it ('Should eval nested #each loop variables properly.', function() {
			return prepcook.processTemplate(data, templates.each_nested)
				.then(function(tpl) {
					assert.equal('abcdefghi', tpl);
				});
		});
		it ('Should eval . as the current element in #each for strings.', function() {
			return prepcook.processTemplate({a: ['abc', 'bcd', 'cde']}, templates.each_string)
				.then(function(tpl) { 
					assert.equal("abcbcdcde", tpl); });
		});
		it ('Should eval . as the current element in #each for numbers.', function() {
			return prepcook.processTemplate({a: ['123', '456', '789']}, templates.each_string)
				.then(function(tpl) { 
					assert.equal("123456789", tpl); });
		});
		it ('Should not eval . if the current element in #each is complex.', function() {
			return prepcook.processTemplate({a: [{b:'abc'}, {b:'bcd'}, {b:'cde'}]}, templates.each_string)
				.then(function(tpl) { 
					assert.equal(BISTRO_FAILURE+BISTRO_FAILURE+BISTRO_FAILURE, tpl); });
		});
		it ('Should only eval . if the current element in #each is a string or number.', function() {
			return prepcook.processTemplate({a: ['123', {b:'bcd'}, 'cde']}, templates.each_string)
				.then(function(tpl) { 
					assert.equal(123+BISTRO_FAILURE+'cde', tpl); });
		});


		/**
		 * Includes
		 */

		 it ('Should include css files', function(){
		 	return prepcook.processTemplate(data,templates.include_css)
		 		.then(function (tpl) {
		 			var expected = 'XY<link rel="stylesheet" type="text/css" href="123/abc.css">Z';
		 			assert.equal(expected, tpl); });
		 });
		 it ('Should bind css files properly');
		 it ('Should bind js files properly');
		 it ('Should include js files', function(){
		 	return prepcook.processTemplate(data,templates.include_js)
		 		.then(function (tpl) {
		 			var expected = 'XY<script src="789/xyz.js"></script>Z';
		 			assert.equal(expected, tpl); });
		 });
		 it ('Should eval include\'s multiple syntax properly', function(){
		 	return prepcook.processTemplate(data,templates.include_multiple)
		 		.then(function (tpl) {
		 			var expected = 'XY' 
		 			+ '<link rel="stylesheet" type="text/css" href="123/abc.css">' 
		 			+ '<script src="789/xyz.js"></script>'
		 			+ 'Z';
		 			assert.equal(expected, tpl); });
		 });
		 it ('Should eval include\'s multiple syntax properly, even when shitespaceis present', function(){
		 	return prepcook.processTemplate(data,templates.include_multiple_whitespace)
		 		.then(function (tpl) {
		 			var expected = 'XY' 
		 			+ '<link rel="stylesheet" type="text/css" href="123/abc.css">' 
		 			+ '<script src="789/xyz.js"></script>'
		 			+ 'Z';
		 			assert.equal(expected, tpl); });
		 });


		/**
		 *
		 *  Nested Templates.
		 *
		 */ 
		it ('Should allow subtemplates without an independant data source.', function() {
			var data = {
				a: '',
				b: '',
				c: '',
			};
			var my_data = prepcook.bindSubTemplate(data, 'content', templates.if_true);
			assert.equal(data.__prepcook.templates.content.template, templates.if_true);
		});

		it ('Should allow subtemplates to execute without an independant data source.');

		it ('Should eval a nested template.', function() {
			return prepcook.processTemplate(data, templates.nested_template)
				.then(function(tpl) {
					assert.equal('hi thereBfoobarFUBAR', tpl); });
		});

		it ('Should eval a nested template using the templates data.', function() {
			return prepcook.processTemplate(data, templates.nested_template)
				.then(function(tpl) {
					assert.equal('hi thereBfoobarFUBAR', tpl); });
		});

		it ('Should eval a nested template using default data from the outer template.', function() {
			return prepcook.processTemplate(data, templates.nested_template_b)
				.then(function(tpl) {
					assert.equal('hi thereAfubarFUBAR', tpl); });
		});

		it ('Should eval a multiple nested templates.', function() {
			return prepcook.processTemplate(data, templates.nested_template_c)
				.then(function(tpl) {
					assert.equal('hi thereBfoobarAfubarFUBAR', tpl); });
		});

		it ('Should eval a var path for a nested template without a dedicated var object.', function(){
			return prepcook.processTemplate(data, templates.nested_template_d)
				.then(function(tpl) {
					assert.equal('hi thereAbCFUBAR', tpl); });
		});
	});
});