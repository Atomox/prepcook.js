/**
 * @file
 *   prepcook.language
 *
 *   This module defines the prepcook template language reserve words, and their behavior.
 *   It is used by the parser when building the parse tree, and evaluating behavior.
 * 
 */


var parsetoken = parsetoken || require('./prepcook.token'),
	parseutil = parseutil || require('./includes/prepcook.utils.js');

const constants = require('./prepcook.config');
const BISTRO_FAILURE = constants.BISTRO_FAILURE;

var lang = (function languageFactory() {
	
	// The list of reserve words used when parsing for reserve words.
	var reserve_word_list = [
		'#each',
		'/each',
		'#if',
		'/if',
		'#else',
		'/else',
		'#elif',
		'/elif',
		'#unless',
		'/unless',
		'#template',
		'/template',
		'#include',
		'/include'
	];

	// The definition of each reserve word, it's type, and behavior.
	const dictionary = {
		'#each': {
				type: 'block',
				behavior: 'loop',
				start: '#each',
				end: '/each',
			},
		'#if':	{
				type: 'block',
				behavior: 'conditional',
				start: '#if',
				end: '/if',
				peers: [
					'#else',
					'#elif'
				],
				rules: [ 
					'all'
				]
			},
		'#else': {
				type: 'block',
				behavior: 'linked-conditional',
				start: '#else',
				end: "/else",
		},
		'#elif': {
				type: 'block',
				behavior: 'linked-conditional',
				start: '#elif',
				end: '/elif',
				peers: [
					'#else',
					'#elif'
				],
				rules: [
					'all'
				]
		},
		'#unless': {
				type: 'block',
				behavior: 'conditional',
				start: '#unless',
				end: '/unless',
				rules: [
					'none'
				]
			},
		'#template': {
				type: 'loader',
				behavior: 'loader',
				start: '#template',
				end: '/template'
		},
		'#include': {
				type: 'loader',
				behavior: 'include',
				start: '#include',
				end: '/include'
		}
	};

	function getWordList () {
		return reserve_word_list;
	}

	function getWordDefinition (word) {
		
		var my_word = word.replace('/', '#');

		if (dictionary[my_word]) {
			// When we were passed a terminus, but we fetched a defintion for it's opening pair,
			// convert that definition to terminus.
			var result = {
				type: (my_word != word) ? 'terminus' : dictionary[my_word].type,
				behavior: dictionary[my_word].behavior,
				start: dictionary[my_word].start,
				end: dictionary[my_word].end,
				rules: dictionary[my_word].rules,
				peers: (typeof dictionary[my_word].peers !== 'undefined') ? dictionary[my_word].peers : []
			};

			return result;
		}
		return false;
	}


	function isConditional (type) {
		return (getWordDefinition(type).behavior == 'conditional') ? true : false;
	}


	function isLinkedConditional (type) {
		return (getWordDefinition(type).behavior == 'linked-conditional') ? true : false;
	}


	function isIterator (type) {
		return (getWordDefinition(type).behavior == 'loop') ? true : false;
	}


	function isLoader (type) {
		return (getWordDefinition(type).behavior == 'loader') ? true : false;
	}


	function isInclude (type) {
		return (getWordDefinition(type).behavior == 'include') ? true : false;
	}


	function resolveContent (type, data, vars, var_path) {
		if (type == 'constant' && typeof data !== 'undefined') {
			return data.trim();
		}
		else if (type == 'expression') {
			return (data.length > 0) 
				? parsetoken.parse(data, vars, [
					{
						left: '[',
						right: ']', 
						callback: parsetoken.evalCommandBlock
					}
					],
					var_path
				) 
				: '';
		}

		return '';
	}


	function resolveConditional (type, data, vars, var_path) {

		// Get the definition.
		var my_word = getWordDefinition(type),
			my_result = evalConditional(type, data, vars, var_path),
			check_result = true;

		if (my_word.rules) {
			for (var i = 0; i < my_word.rules.length; i++) {
				switch (my_word.rules[i]) {
					
					case 'all':
						if (my_result === false) { check_result = false; }
						break;

					case 'none':
						if (my_result === true) { check_result = false; }
						break;
				}
			}

			return check_result;
		}

		return my_result;
	}


	/**
	 * Evaluate a conditional.
	 * 
	 * @param  {string} type
	 *   Conditional type. Defaults to if.
	 * @param  {string} expression
	 *   The expression of the conditional.
	 * @param  {variable} data
	 *   The scope of variables passed to this level of the function.
	 * 
	 * @return {boolean}
	 *   TRUE if it evaluates to true.
	 */
	function evalConditional(type, expression, data, var_path) {

		try {
			// Since else has no expression, always return true right away.
			if (type == '#else') { return true; }

			// Trim whitespace before passing the regex.
			expression = (typeof expression === 'string') ? expression.trim() : expression;

			// Check for a single variable expression referencing the current base level of data.
			if (/^([a-z0-9_\-\.]+)+$/i.test(expression)) {
				var singleExp = parseutil.normalizeExpression(expression, data, var_path, true);
				return (singleExp && singleExp !== BISTRO_FAILURE) ? true : false;
			}
			// Otherwise, we're dealing with something more complex.
			else if (exp = expression.match(/^([\"\'a-z0-9_\-\.]+)[\s]?(>=|<|>|==|!=)[\s]?([a-z0-9_\-\.\'\"]+)$/i)) {
				if (Array.isArray(exp) === false) {
					throw new Error('Expression does not eval.');
				}
				else {
					var op = (exp[2]) ? exp[2] : null,
						left = parseutil.normalizeExpression(exp[1], data, var_path, true),
						right = parseutil.normalizeExpression(exp[3], data, var_path, true); 

					if (left === BISTRO_FAILURE || right === BISTRO_FAILURE) {
						console.warn('One or more vars in expression "' + expression + '" had errors.', left, right);

						if (left === BISTRO_FAILURE) { left = null; }
						if (right === BISTRO_FAILURE) { right = null; }
					}

					switch (op) {

						case '==': return left == right; break;
						case '>': return left > right; break;
						case '>=': return left >= right; break;
						case '<': return left < right; break;
						case '<=': return left <= right; break;
						case '!=': return left != right; break;

						default:
							throw new Error('Expression op could not be resolved.');
					}
				}
			}
		}
		catch (e) {
			console.warn('One or more errors occured while parsing expression. ', e, ' Passed expression: ', expression);
		}
		return BISTRO_FAILURE;
	}


	/**
	 * Is (end) a valid ending reserve word for (start)?
	 * 
	 * @param  {string} end
	 *   A reserve word terminus.
	 * @param  {string} start
	 *   Some reserve word we should check for compatability with end.
	 * 
	 * @return {boolean}
	 *   TRUE if end is a valid match. Otherwise, FALSE.
	 */
	function terminusMatch (end, start) {
		if (my_word = getWordDefinition(start)) {
			if (my_word.end == end) {
				return true;
			}
		}

		return false;
	}

	return {
		getWordList: getWordList,
		getWord: getWordDefinition,
		terminusMatch: terminusMatch,
		isConditional: isConditional,
		isLinkedConditional: isLinkedConditional,
		isIterator: isIterator,
		isLoader: isLoader,
		isInclude: isInclude,
		resolveContent: resolveContent,
		resolveConditional: resolveConditional
	};
})();

module.exports = {
	reserveWordList: lang.getWordList,
	getWord: lang.getWord,
	terminusMatch: lang.terminusMatch,
	isConditional: lang.isConditional,
	isLinkedConditional: lang.isLinkedConditional,
	isIterator: lang.isIterator,
	isLoader: lang.isLoader,
	isInclude: lang.isInclude,
	resolveContent: lang.resolveContent,
	resolveConditional: lang.resolveConditional
};