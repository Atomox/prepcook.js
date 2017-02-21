/**
 * @file
 *   prepcook.token
 *
 *   This module parses strings for tokens/variables, like: [variable|type],
 *   and replaces them with their value from the paseed context.
 */

var parseutil = parseutil || require('./includes/prepcook.utils'),
	filter = filter || require('./prepcook.filter');

const constants = require('./prepcook.config');
const BISTRO_FAILURE = constants.BISTRO_FAILURE;

var prepcook_tokenizer = (function tokenProcessFactory() {


	/**
	 * Parse a given string for blocks of code to pass to a callback for evaluation.
	 * 
	 * @param  {string} template
	 *   A string of data we should parse.
	 * @param  {Object} vars
	 *   A set of data we should pass to the callback for contextual evaluating of any matched blocks.
	 * @param {array(object)} delim_lft_rt_callback
	 *   An array of 1 or more objects with three attributes:
	 *   | @param  {string} delimeter_left
	 *   |   A delimeter denoting the start of a code block.
	 *   | @param  {string} delimeter_right
	 *   |   A delimeter denoting the end of a code block.
	 *   | @param  {[type]} callback
	 *   |   A callback function we should pass any blocks we find to. Should expect (string, vars),
	 *   |   and replace any control blocks with evaluated strings.
	 * 
	 * @return {string}
	 *   The template, with all blocks evaluated.
	 */
	function parse (template, vars, delim_lft_rt_callback, var_path) {

		var left = '',
			right = template,
			current_segment = null,
			blockProcessCallback = null;

		// Process the template until it's been consumed, and no outstanding segments remain.
		while (right.length > 0 || current_segment !== null) {

			// Process any outstanding segments.
			if (current_segment !== null) {
				current_segment = blockProcessCallback(current_segment, vars, var_path);
				left += (typeof current_segment == 'string') ? current_segment : '';
				current_segment = null;
			}
			// If no current segment, look for next one.
			else {
				
				var first = null, tmp_l = null, tmp_r = null,
					tmp_callback = null, last_delimeter_right = null;

				// In case we have multiple delimeter pairs,
				// look for whichever occurs first, and use that one.
				for (var z = 0; z < delim_lft_rt_callback.length; z++) {
					var zObj = delim_lft_rt_callback[z];

					if (typeof zObj.left !== 'string' || zObj.left.length <= 0) {
						throw new Error('Left delimeter was not passed!');
					}
					else if (typeof zObj.right !== 'string' || zObj.right.length <= 0) {
						throw new Error('Right delimeter was not passed!');
					}

					// Get everything up to our opening paren, and add to complete.
					// If no seperator is found, we're done.
					var temp = parseutil.splitOnce(right,zObj.left);				
					
					if (tmp_l === null || temp[0].length < tmp_l.length) {
						tmp_l = temp[0];
						tmp_r = (temp[1]) ? temp[1] : '';
						blockProcessCallback = zObj.callback;
						last_delimeter_right = zObj.right;
					}
				}

				left += tmp_l.trim();
				right = tmp_r;

				// If we found a start, right should be a block code segment.
				// Split again by end delimeter.
				if (right.length > 0) {
					// Get everything up to our first closing paren,
					// and make it our current_segment.
					// Add remainder as the remaining right.
					temp = parseutil.splitOnce(right,last_delimeter_right);
					current_segment = temp[0];
					right = (temp[1]) ? temp[1] : '';
				}
			}
		}

		return left;
	}


	/**
	 * A callback which converts commands/filters into values,
	 * based upon the vars.
	 *
	 * Define all syntax/commands for our template language here.
	 * 
	 * @param  {string} segment
	 *   A single command string, which should contain a single command.
	 * @param  {Object} vars
	 *   An object containing all vars tis template might reference.
	 *  
	 * @return {string}
	 *   The segment, with the command evaluated.
	 */
	function evalCommandBlock (segment, vars, var_path) {

		// This should be either a function or a pattern...
		var params = segment.split('|');
		var maps_to = '';

		if (params[1]) {
			switch (params[1]) {

				case 'int':
				case 'text':
				case 'array':
				case 'list':
				case 'string':
					var var_value = parseutil.normalizeExpression(params[0], vars, var_path);
					if (var_value !== BISTRO_FAILURE) {
						maps_to = var_value;
					}
					else {
						throw new Error('Bad template variable reference: ' + params[0]);
					}
					break;

				case 'function':
				case 'callback':
					/**
					 
					  @todo

					 */
					break;

				default:

					var var_args = params[1].split(':'),
						var_value;
					params[1] = var_args[0];
					var_args.splice(0, 1);

					if (typeof filter[params[1]] == 'function') {
						params[0] = parseutil.normalizeExpression(params[0], vars, var_path);
						var_value = (params[0] !== BISTRO_FAILURE) ? filter[params[1]](params[0], ...var_args) : BISTRO_FAILURE;
					}

					if (var_value !== BISTRO_FAILURE) {
						maps_to = var_value;
					}
					else {
						throw new Error('Bad template variable reference: ' + params[0]);
					}
			}

			return maps_to;
		}

		// Eval any params or expressions as normal, if there were no filters.
		return parseutil.normalizeExpression(params[0], vars, var_path);
	}

	return {
		parse: parse,
		evalCommandBlock: evalCommandBlock
	};

})();


module.exports = {
	parse: prepcook_tokenizer.parse,
	evalCommandBlock: prepcook_tokenizer.evalCommandBlock
};