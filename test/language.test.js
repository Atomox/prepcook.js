var assert = require('assert');
const BISTRO_FAILURE = BISTRO_FAILURE || '__FAILURE';

var lang = lang || require('../prepcook.language');

describe('Language', function() {
	describe('resolveConditional()', function() {

		var templates = {
				if_equal: 'c == d',
				if_unequal: 'foo != bar.baz',
				if_gt: 'b > a',
				if_lt: 'a < b',
				if_gte: "c >= d",
				if_lte: 'c<= d',
			}, 
			data = {
				a: 1,
				b: 2,
				c: 3,
				d: 3,
				foo: 'fubar',
				bar: {baz: 'hi there'}
			};


		// Expected behavior.
		it ('#if 3 == 3 should be true.', function() {
			assert.equal(true, lang.resolveConditional('#if', templates.if_equal, data));
		});
		it ('#if fubar != "hi there" should be true.', function() {
			assert.equal(true, lang.resolveConditional('#if', templates.if_unequal, data));
		});
		it ('#if 2 > 1 should be true.', function() {
			assert.equal(true, lang.resolveConditional('#if', templates.if_gt, data));
		});
		it ('#if 3 == 3 should be true.', function() {
			assert.equal(true, lang.resolveConditional('#if', templates.if_lt, data));
		});
		it ('#if 3 >= 3 should be true.', function() {
			assert.equal(true, lang.resolveConditional('#if', templates.if_gte, data));
		});
		it ('#if 3 <= 3 should be true.', function() {
			assert.equal(true, lang.resolveConditional('#if', templates.if_lte, data));
		});

	});
});