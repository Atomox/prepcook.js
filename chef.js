var parsutil = parsutil || require('./includes/prepcook.utils'),
	parsetree = parsetree || require('./includes/prepcook.parse-tree'),
	stack = stack || require('./includes/prepcook.stack'),
	lang = lang || require('./prepcook.language');


var chef = (function chefFactory() {
	const BISTRO_FAILURE = '__FAILURE';

	/**
	 * Given a template and some contextual data, parse, evaluate,
	 * and return our final template for display to the user.
	 * 
	 * @param  {Object} data
	 *   A set of data we should pass to the callback for contextual evaluating of any matched blocks.
	 * @param  {string} template
	 *   A string of data we should parse.
	 *   
	 * @return {string}
	 *   A promise, which will resolve with the template, with all blocks evaluated.
	 */
	function processTemplate(data, template) {

		return new Promise(function (resolve, reject) {
			try {

				// Convert the template to a tree structure.
				var parse_tree = parseTree(template);

				// Debugger
//				parse_tree.dump();

				var parsed_tpl = resolveParseTree(parse_tree, data);

				resolve(parsed_tpl);
			}
			catch(Error){
				reject(Error);	
			}
		});
	}


	/**
	 * @todo 
	 *   Rewrite Parse using Tree.
	 */
	function parseTree (template) {
		
		var right = template,
			tree = parsetree,
			parents = new stack.Stack();

			// Push the root element onto the array.
			parents.push(tree.root());

		while (right && right.length > 0) {

			// Get next segment. {{SOME_SEGMENT}}
			var tmp = parseNextSegment (right, '{{', '}}');

			if (tmp.left.length > 0) {
				tree.add('constant', parents.peek().id, parents.peek(), tmp.left);
			}

			// The command segment to analyze.
			var segment = tmp.segment;

			// The unprocessed remainder of the template.
			right = (tmp.right.length > 0) ? tmp.right : null;

			// Lexical analysis:
			while (segment && segment.length > 0) {

				var command = parseReserveWord(segment);

				if (typeof command.word !== 'undefined' && typeof command.type !== 'undefined') {
					var my_leaf = null;

					switch(command.type) {
						case 'block':
							// Add the block_word to the tree, and the parent to the stack.
							my_leaf = tree.add(command.word, parents.peek().id, parents.peek(), command.segment);
							parents.push(my_leaf);							
							break;
					
						case 'block_terminus':
							// Pop the parent off, add this as a parent.
							parents.pop();
							my_leaf = tree.add(command.word, parents.peek().id, parents.peek(), command.segment);
							parents.push(my_leaf);
							break;

						case 'terminus':

							// Make sure this terminus is matching the parent, or fail.
							// E.G. /if should not occur while #each is the most recent parent. #each should be closed,
							// first (or a new #if placed as a child of #if).
							if (command.word.replace('/', '#') !== parents.peek().data.type) {
								throw new Error('Encountered a terminus (' + command.word + ') but expected (' + parents.peek().data.type.replace('#', '/') + ').');
							}
							// If the block_terminus pairs with the parent type,
							// pop the next element off the stack, and make it the parent.
							parents.pop();
							break;

						case 'reserve':
							// add reserve words to tree.
							/**
							   @TODO
							 */
							break;

						case 'variable':
						default:
							console.warn('Could not parse command: ' + command.type);
					}
				}
				else {
					my_leaf = tree.add('expression', parents.peek().id, parents.peek(), segment);
				}

				// Process the remainder.
				segment = (typeof command.remainder !== 'undefined') ? command.remainder : null;
			}
		}

		return tree;
	}


	/**
	 * Convert a parse tree into it's final template form.
	 *
	 * @param  {Tree} tree
	 *   A parse tree, ready for contextual evaluation.
	 * @param  {object} data
	 *   The data object, as passed along with the original template.
	 * 
	 * @return {string}
	 *   The final template, translated into normal HTML.
	 */
	function resolveParseTree (tree, data) {
		return traverseParseTree(tree.root(), data);
	}


	/**
	 * Travel the parse tree, evaluating each node, and returning the final translation.
	 * 
	 * @param  {node} node
	 *   The highest (root) segment of the remaining parse tree.
	 *   Start by passing the root node here (not the tree).
	 * @param  {object} data
	 *   The contextual data. Pass the current level of relevent data where the tree's
	 *   leaves should look for their variables.
	 * @param  {int} level
	 *   The current depth of the tree. Defaults to 0.
	 * 
	 * @return {string}
	 *    The resolved tree, including resolved commands and tokens.
	 */
	function traverseParseTree (node, data, level) {
 
        if (typeof node === 'undefined') {
        	console.warn('Cannot resolve undefined parse tree.');
        }
        //
        //   @todo
        //     node instanceof
        
        if (!level) { level = 0; }
        var children = node.children,
            offset = Array(level+1).join(' '),
            result = '';

        // Check the current node's data, and apply it's data, if applicable.
        if (node.data && node.data.data) {
        	switch (node.data.type) {
        		
        		case 'expression':
        			result += (node.data.data.length > 0) 
						? parse(node.data.data, data, [
							{
								left: '[',
								right: ']', 
								callback: evalCommandBlock
							}
						]) 
						: '';
        			break;
        		
        		case '#if':
        			if (evalConditional('if', node.data.data, data) === true) { 
        				console.log(node.data.data, 'evaluates to', 'true');
        			}
        			else {
        				// If our conditional failed, it's line has ended.
        				// Do not containue to it's decendants.
        				console.log(node.data.data, 'evaluates to', 'false');
        				return result;
        			}
        			break;

        		case 'constant':
        			result += node.data.data;
        	}
        }

        // Loops render their decendants more than once, generally.
        if (node.data && typeof node.data.type !== 'undefined' && node.data.type == '#each') {

        	console.log(node.data.data, ' -> ', data[node.data.data], typeof data[node.data.data]);

        	if (typeof data[node.data.data] === 'object') {
        		for (var i = 0; i < data[node.data.data].length; i++) {
			        for (var j = 0; j < children.length; j++) {
			            if (children[j]) {
			            	result += traverseParseTree(children[j], data[node.data.data][i], (level+1));
			            }
			        }        			
        		}
        	}
        }
        // Non-Loops only render once.
        else {
	        for (var j = 0; j < children.length; j++) {
	            if (children[j]) {
	               result += traverseParseTree(children[j], data, (level+1));
	            }
	        }
        }

		return result;
	}


	/**
	 * Check for any reserve words, identify their segments from other reserve words, and return their object definition for the parse tree.
	 * 
	 * @param  {string} segment
	 *   A block a code found in a code block, whcih may contain reserve words.
	 * 
	 * @return {object|boolean}
	 *   If a reserve word was found, the reserve word object, as well as the
	 *   remainder segment to be processed on the next call. Otherwise, FALSE,
	 *   if none were found.
	 *
	 * @see prepcook.language.js for reserve word definitions.
	 */
	function parseReserveWord (segment) {

		if (segment && segment.length > 0) {
			// Get the very next reserve word.
			var remainder = '';

			// Find the first occuring word, and pivot on it.
			if (first = parsutil.firstOccuring(lang.reserveWordList(), segment)) {

				var temp = parsutil.splitOnce (segment, first);

				if (!lang.getWord(first)) {
					throw new Error('Lexical Analysis for term "' + first + '" failed.');
				}

				// Segment is the remaining segment (after first).
				segment = temp[1] ? temp[1] : '';

				// Check for any remainder, with possible terms. Chop off anything
				// starting with a second reserve word, and do not include as segment for first.
				// Instead, pass back as a remainder, so we can continue parsing commands,
				// one at a time.
				if (segment.length > 0) {
					if (second = parsutil.firstOccuring(lang.reserveWordList(), segment)) {
						var temp2 = parsutil.splitOnce (segment, second);
						segment = temp2[0];
						remainder = temp2[1] ? second + temp2[1] : second + '';
					}
				}

				return {
					type: lang.getWord(first).behavior, 
					word: first,
					segment: segment.trim(),
					remainder: remainder
				}			
			}
		}
		
		return false;
	}


	/**
	 * Find the next occuring code block segment in code, and return it.
	 *
	 * Any non-code block code (constants, like HTML), found before the
	 * first block will be returned as left. Anything found after the
	 * end of the first occuring code block will be returned as right.
	 * 
	 * @param  {string} segment
	 *   A string, with possible code blocks within it, defignated between 
	 *   delimeter_left and delimeter_right.  
	 * @param  {string} delimeter_left
	 *   The character(s) signifying the start of the code block.
	 * @param  {string} delimeter_right
	 *   The character(s) signifying the end of the code block.
	 * 
	 * @return {object}
	 *   An object with:
	 *   left:       All text occuring before the first
	 *   			 delimeter_left is found.
	 *   segment:    All text found within the first delimeter_left
	 *   			 and first delimeter_right.
	 *   right: 	 All text occuring after the segment, returned unprocessed.
	 */
	function parseNextSegment (segment, delimeter_left, delimeter_right) {

		// Get everything up to our opening paren, and add to complete.
		// If no seperator is found, we're done.
		var temp = parsutil.splitOnce(segment,delimeter_left);				
		
		var left = temp[0],
			segment = '',
			right = (temp[1]) ? temp[1] : '';

		// If we found a start, right should be a block code segment.
		// Split again by end delimeter.
		if (right.length > 0) {
			// Get everything up to our first closing paren,
			// and make it our current_segment.
			// Add remainder as the remaining right.
			temp = parsutil.splitOnce(right,delimeter_right);
			segment = temp[0];
			right = (temp[1]) ? temp[1] : '';
		}

		return {
			left: left,
			segment: segment,
			right: right
		};
	}


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
	function parse (template, vars, delim_lft_rt_callback) {

		var left = '',
			right = template,
			current_segment = null,
			blockProcessCallback = null;

		// Process the template until it's been consumed, and no outstanding segments remain.
		while (right.length > 0 || current_segment !== null) {

			// Process any outstanding segments.
			if (current_segment !== null) {
				current_segment = blockProcessCallback(current_segment,vars);
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

					// Get everything up to our opening paren, and add to complete.
					// If no seperator is found, we're done.
					var temp = parsutil.splitOnce(right,zObj.left);				
					
					if (tmp_l === null || temp[0].length < tmp_l.length) {
						tmp_l = temp[0];
						tmp_r = (temp[1]) ? temp[1] : '';
						blockProcessCallback = zObj.callback;
						last_delimeter_right = zObj.right;
					}
				}

				left += tmp_l;
				right = tmp_r;

				// If we found a start, right should be a block code segment.
				// Split again by end delimeter.
				if (right.length > 0) {
					// Get everything up to our first closing paren,
					// and make it our current_segment.
					// Add remainder as the remaining right.
					temp = parsutil.splitOnce(right,last_delimeter_right);
					current_segment = temp[0];
					right = (temp[1]) ? temp[1] : '';
				}
			}
		}

		return left;
	}


	/**
	 * Given an exression in a template passed as part of a reserve word,
	 * normalize the value, so it maybe be properly evaluated.
	 * 
	 * @param  {string} exp
	 *   Some expression in string form, like foo.bar, 123, or true.
	 * @param  {obj} data
	 *   The context data where we can featch any data to evaluate this expression.
	 * 
	 * @return {mixed|Failure}
	 *   The normalized value, or failure.
	 */
	function normalizeExpression(exp, data) {

		var regex_path = /^([a-z][_\-a-z0-9]+)\.(([a-z][_\-a-z0-9]+)\.?)+$/i,
		    regex_num = /^[\-0-9]+[.]?[0-9]*$/;

		if (typeof exp === 'string') {
			exp = exp.trim();

			if (exp == 'true') { exp = true; }
			else if (exp == 'false') { exp = false; }
			else if (regex_num.test(exp)) { exp = Number(exp); }
			else if (typeof data !== 'object') { console.warn('Expression appears to depend upon data, Expected as object, but found', typeof data, '.'); }
			else if (obj_path = exp.match(regex_path)) { exp = parsutil.getObjectPath(exp, data); }
			else if (data[exp]) { exp = data[exp]; }
			else { 
				console.warn('Expression ' + exp + ' could not be evaluated.');
				exp = BISTRO_FAILURE;
			}
		}

		return exp;
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
	function evalConditional(type, expression, data) {

		try {
			// Trim whitespace before passing the regex.
			expression = expression.trim();

			// Check for a single variable expression referencing the current base level of data.
			if (/^([a-z0-9_\-\.]+)+$/i.test(expression)) {
				var singleExp = normalizeExpression(expression, data);
				return (singleExp && singleExp !== BISTRO_FAILURE) ? true : false;
			}
			// Otherwise, we're dealing with something more complex.
			else if (exp = expression.match(/^([a-z0-9_\-\.]+)[\s]?(>=|<|>|==|!=)[\s]?([a-z0-9_\-\.]+)$/i)) {
				if (Array.isArray(exp) === false) {
					throw new Error('Expression does not eval.');
				}
				else {
					var op = (exp[2]) ? exp[2] : null,
						left = normalizeExpression(exp[1], data),
						right = normalizeExpression(exp[3], data); 

					if (left === BISTRO_FAILURE || right === BISTRO_FAILURE) {
						throw new Error('One or more vars in expression had errors.');
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
	function evalCommandBlock (segment, vars) {

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
					var var_value = normalizeExpression(params[0], vars);
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
			}
		}

		return maps_to;
	}
	
	return {
		processTemplate: processTemplate
	};
})();

module.exports = {
	processTemplate: chef.processTemplate
};