const BISTRO_FAILURE = '__FAILURE';

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
			if (typeof haystack !== 'object') {
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

	return {
		splitOnce: splitOnce,
		firstOccuring: firstOccuring,
		getObjectPath: getObjectPath
	};
})();

module.exports = {
	firstOccuring: server_utils.firstOccuring,
	splitOnce: server_utils.splitOnce,
	getObjectPath: server_utils.getObjectPath
};