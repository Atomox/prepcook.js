const constants = require('../prepcook.config');
const BISTRO_FAILURE = constants.BISTRO_FAILURE;

var server_utils = (function utils() {

	/**
	 * Find the first occuring needle, and return it.
	 * 
	 * @param  {array(strings)} needles
	 *   One or more competing needles.
	 * @param  {string} haystack
	 * 
	 * @return {string}
	 *   The first occuring needle.
	 */
	function firstOccuring(needles, haystack) {

		if (typeof needles === 'undefined' || needles == null) {
			console.warn('Attempting to search a haystack for an empty needle.');
			return false;
		}
		else if (typeof haystack === 'undefined' || haystack == null) {
			console.warn('Attempting to search an empty haystack for a needle.');
			return false;
		}

		var champion = {
			pos: -1,
			name: ''
		}

		// Enforce an array.
		if (typeof needles !== 'object') { needles = [needles]; }

		// Find our champion.
		for (var i = 0; i < needles.length; i++) {
			var tmp = haystack.indexOf(needles[i]);
			if (tmp < 0) {
				continue;
			}
			else if (champion.pos === -1 || tmp < champion.pos && tmp >= 0) { 
				champion.pos = tmp;
				champion.name = needles[i]; 
			}
		}

		return champion.name;
	}


	/**
	 * Split a string into 2 pieces, left of first delimeter, and right of first delimeter.
	 * 
	 * @param  {string} str
	 *   A string to split.
	 * @param  {string} delimeter
	 *   A delimter to split around. If "\n" is passed, we'll search for multiple types of new lines,
	 *   and split on the first one occuring in the string.
	 *   
	 * @return {array}
	 *   An array of up to 2 results, where [0] is the left side of the string at the first delimeter occurance,
	 *   and [1] is the right side of the first occurance of delimeter, unless unfound, or delimeter is at the end.
	 */
	function splitOnce(str,delimeter) {

		if (typeof str !== 'string' 
			|| typeof delimeter !== 'string') {
			throw new Error('splitOnce() expects string value.');
		}

		var pos = -1, results = [];

		/**
		   @TODO

		     This is untested.

		 */
		// When newline is the character, check for the first existance of
		// multiple types of new lines (can change per environment).
		if (delimeter === "\n") {
			var eol = ["\n", "\r", "\r\n"];
			for (var i = 0; i < eol.length; i++) {
				var tmp = str.indexOf(eol[i]);
				if (pos < 0 || (tmp < pos && tmp >= 0)) { 
					pos = tmp; 
				}
			}
		}
		else {
			pos = str.indexOf(delimeter);
		}

		// If there is no delimeter, return the entire array as results[0].
		if (pos == -1) {
			return [str];
		}
		results[0] = str.substring(0, pos);
		
		// Only have a second have if we found a pos
		if (pos < str.length-delimeter.length) {
			results[1] = str.substring(pos+delimeter.length);
		}
		// Even if delimeter was at the end of the string,
		// include [1] to show that it was found.
		else {
			results[1] = '';
		}

		return results;
	}


	/**
	 * Given an object, and a path like foo.bar.baz,
	 * get the value stored in obj at the passed path.
	 *
	 * @param  {needle} needle
	 *   The path we're searching for in haystack.
	 * @param  {object} haystack
	 *   The object where we should evaluate/search for our needle (path).
	 * 
	 * @return {mixed|FAILURE}
	 *   THe value at haystack.needle, or BISTRO_FAILURE on fail.
	 */
	function getObjectPath(needle, haystack) {
		
		try {
			if (typeof haystack !== 'object' || haystack === null) {
				throw new Error('Type object expected for haystack.');
			}

			// Copy, so we don't modify any objects passed by reference.
			var my_obj = haystack;
			needle = needle.split('.');

			if (typeof needle !== 'object') {
				throw new Error('Could not split ' + needle + ' into expected parts.');
			}

			for (var i = 0; i < needle.length; i++) {
				if (my_obj[needle[i]]) {
					my_obj = my_obj[needle[i]];
				}
				else {
					throw new Error('Path ' + needle[i] + ' does not exist');
				}
			}

			return my_obj;
		}
		catch (e) {
			console.warn('Error resolving getObjectPath. ', e);
		}

		return BISTRO_FAILURE;
	}


	/**
	 * Is this variable set?
	 * 
	 * @param  {mixed} item
	 *   Varibable we're checking.
	 * @param  {string} type
	 *   Expected type.
	 * 
	 * @return {boolean}
	 *   True if set. False in all other cases.
	 */
	function isset(item, type) {
		if (typeof item !== 'undefined' && item !== null) {
			return true;
		}

		return false;
	}


	/**
	 * Unwrap a string wrapped by a delimeter.
	 *
	 * E.G 
	 *    var str = "'hiMom'";
	 *    calling: unwrap(str, ['"']);
	 *    returns: hiMom
	 * 
	 * @param  {[type]} str
	 *   A string, possibally wrapped by delimeters. 
	 * @param  {str|array(str)} delimeters
	 *   One or more delimeters to search for. 
	 * 
	 * @return {str}
	 *   The string, unwrapped by the outtermost wrapping delimeter, if found.
	 */
	function unwrap(str, delimeters) {
		if (typeof delimeters === 'string') { delimeters = [delimeters]; }

		str = str.trim();

		for (var i = 0; i < delimeters.length; i++) {
			if (str.substring(0,1) == delimeters[i]
				&& str.substring(-1,1) == delimeters[i]) {
				return str.substring(1, str.length-1);
			}
		}

		return str;
	}


	/**
	 * Given an expression, check for operators, like scope traversal. (../)
	 * 
	 * @param  {string} exp
	 *   A simple variable expression, which could reference a variable, and optional operators.
	 * 
	 * @return {object}
	 *   exp: final expression,
	 *   scope_offset: (int) number of levels below current scope where this variable should is expected to live.
	 */
	function resolveExpressionOperators (exp) {
		if (typeof exp === 'number' || typeof exp === 'boolean') {
			return;
		}
		if (typeof exp !== 'string') {
			throw new Error('Invalid expression. Expected string, but found ' + typeof exp);
		}
		else if (exp.length <= 0 || exp === null) {
			throw new Error('Cannot evaluate empty expression.');
		}

		var tmp = exp,
			back_levels = 0,
			traverse_expression = /((?:\.{2}\/)+)((?:[a-z0-9_\-]+)*(?:\.[a-z0-9_\-]+){0,})/ig

		// Search for "down one level" (../) operator at the beginning of the path.
		if (my_match = traverse_expression.exec(exp)) {
			if (typeof my_match[2] !== 'undefined') {
				tmp = my_match[2];
				back_levels = my_match[1].length/3;
			}
		}

		return {
			exp: tmp,
			scope_offset: back_levels
		}
	}


	/**
	 * Given a variable path, resolve it, and return that sub-data.
	 * 
	 * @param  {object} vars
	 *   The template variable object.
	 * @param  {string} path
	 *   The path to the current object location, in dot notation.
	 *   Note: numbers will resolve to the current element in an array.
	 * @param  {int} scope_offset
	 *   Number of levels above current path where we should resolve the scope.
	 * 
	 * @return {mixed}
	 *   The current sub-object the path points to.
	 */
	function resolveVarPath (vars, path, scope_offset) {
		if (path.length <= 0 || path === null) {
			return vars;
		}

		if (typeof vars !== 'object' || vars === null) {
			throw new Error('Cannot resolve path for non-object.');
		}
		else if (typeof path !== 'string' && path !== null) {
			throw new Error('Cannot resolve non-string path.');
		}

		var tmp = vars;

		// Split the path into levels.
		var my_path = path.split('.');

		// Traverse the level of our path, up (scope_offset) levels.
		if (scope_offset > 0) {
			for (var i = 0; i < scope_offset; i++) {
				if (my_path.length > 0) {
					my_path.pop();
				}
				else {
					throw new Error('Out of bound exception for ../ operator. Requested: ' + scope_offset +', available length: ' + my_path.length);
				}
			}
		}
		
		// Search our vars for the specified level.
		for (var i = 0; i < my_path.length; i++) {
			if (tmp[my_path[i]]) {
				tmp = tmp[my_path[i]];
			}
			else {
				throw new Error('Cannot resolve complete path in relative path.');
			}
		}

		return tmp;
	}


	/**
	 * Given an exression in a template passed as part of a reserve word,
	 * normalize the value, so it maybe be properly evaluated.
	 * 
	 * @param  {string} exp
	 *   Some expression in string form, like foo.bar, 123, or true.
	 * @param  {obj} data
	 *   The context data where we can fetch any data to evaluate this expression.
	 * @param {string} var_path
	 *   A path we can eval to traverse the data to find the location of our value.
	 * 
	 * @return {mixed|Failure}
	 *   The normalized value, or failure.
	 */
	function normalizeExpression(exp, data, var_path, supress_warnings) {

		var scope_offset = 0;

		if (exp_res = resolveExpressionOperators(exp)) {
			exp = exp_res.exp;
			scope_offset = exp_res.scope_offset;
		}

		// Get the sub-set of vars at this current scope.
		// We pass the entire context array throughout parsing, but a current path pointer (path),
		// so we can use the current scope for the expression we are about to evaluate.
		if (typeof var_path === 'string' && typeof data === 'object') {
			var data = resolveVarPath(data, var_path, scope_offset);
		}

		var regex_path = /^([a-z][_\-a-z0-9]+)\.(([a-z][_\-a-z0-9]+)\.?)+$/i,
		    regex_num = /^[\-0-9]+[.]?[0-9]*$/,
		    regex_literal = /^[\'\"](.*)[\'\"]$/i,
		    regex_period = /^\.$/i;

		if (typeof exp === 'string') {
			exp = exp.trim();

			if (exp == 'true') { exp = true; }
			else if (exp == 'false') { exp = false; }
			else if (regex_num.test(exp)) { exp = Number(exp); }
			else if (regex_literal.test(exp)) { exp = unwrap(exp, ["'", '"']); }
			else if (regex_period.test(exp) && (typeof data === 'string' || typeof data === 'number')) { 
				if (regex_num.test(exp)) { exp = Number(exp); }
				else {exp = data; } 
			}
			else if (typeof data !== 'object' || data === null) { 
				if (!supress_warnings) {
					console.warn('Expression appears to depend upon data, Expected as object, but found', typeof data, '.'); 
				}
				exp = BISTRO_FAILURE;
			}
			else if (obj_path = exp.match(regex_path)) { exp = getObjectPath(exp, data); }
			else if (data[exp]) { exp = data[exp]; }
			else { 
				if (!supress_warnings) {
					console.warn('Expression "' + exp + '" could not be evaluated.');
				}
				exp = BISTRO_FAILURE;
			}
		}

		return exp;
	}


	return {
		splitOnce: splitOnce,
		firstOccuring: firstOccuring,
		getObjectPath: getObjectPath,
		isset: isset,
		resolveVarPath: resolveVarPath,
		normalizeExpression: normalizeExpression
	};
})();

module.exports = {
	firstOccuring: server_utils.firstOccuring,
	splitOnce: server_utils.splitOnce,
	getObjectPath: server_utils.getObjectPath,
	isset: server_utils.isset,
	resolveVarPath: server_utils.resolveVarPath,
	normalizeExpression: server_utils.normalizeExpression
};
