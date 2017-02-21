var parseutil = parseutil || require('./includes/prepcook.utils'),
	parsetoken = parsetoken || require('./prepcook.token'),
	parsetree = parsetree || require('./includes/prepcook.parse-tree'),
	stack = stack || require('./includes/prepcook.stack'),
	lang = lang || require('./prepcook.language');

const constants = require('./prepcook.config');
const BISTRO_FAILURE = constants.BISTRO_FAILURE;

var chef = (function chefFactory() {

	/**
	 * Bind a Prepcook setting to the prepcook namespace.
	 * 
	 * @param  {object} data
	 *   The data object which will be passed to processTemplate.
	 * @param  {string} type
	 *   The type of thing we are binding. E.G. #template for template loading function.
	 * @param  {function} funct
	 *   The callback function. Should generally be a promise.
	 * 
	 * @return {object}
	 *   The data object, with binding appended.
	 */
	function prepcookBindFunction(data, type, funct) {

		data = prepcookPrepareData(data);

		switch (type) {
			case '#template':
				data.__prepcook['#template'] = funct;
				break;
		}

		return data;
	}


	/**
	 * Bind a subtemplate to the data object, so prepcook can resolve subtemplates later.
	 * 
	 * @param  {object} data
	 *   The data object which will be passed to processTemplate.
	 * @param  {string} name
	 *   The machine_name of the template.
	 * @param  {string} tpl
	 *   The template to be parsed.
	 * @param  {object} vars
	 *   The vars needed when parsing the passed template.
	 * 
	 * @return {object}
	 *   The data object, with binding appended.
	 */
	function prepcookBindSubTemplate(data, name, tpl, vars) {

		data = prepcookPrepareData(data);

		data.__prepcook.templates[name] = {
			template: tpl,
			vars: vars
		};

		return data;
	}


	/**
	 * Initialize a template data object, if not already.
	 * 
	 * @param  {object} data
	 *   The data object which will be passed to processTemplate.
	 * 
	 * @return {object}
	 *   The data object, prepared.
	 */
	function prepcookPrepareData(data) {

		if (typeof data === 'object') {
			if (data === null) {
				data = {};
			}
		}

		if (!data.__prepcook) {
			data['__prepcook'] = {};
		}
		if (!data.__prepcook.templates) {
			data.__prepcook.templates = [];
		}

		return data;
	}


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

				resolveParseTree(parse_tree, data)
				  .then(function (final_tpl) {
					resolve(final_tpl);
				  })
				  .catch(function (err) {
				  	console.log('Error resolving parse tree...  ',err);
				  	reject(err);
				  });
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
			tree = new parsetree.ParseTree(),
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

					var my_leaf = null,
						my_type = command.type,
						parent_def = (typeof parents.peek().data !== 'undefined' && parents.peek().data !== null) 
							? lang.getWord(parents.peek().data.type) 
							: false;

					// If the parent has peers, and command.type is in the peer array, then this doubles as a block_terminus.
					if (parent_def && typeof parent_def.peers === 'object' && parent_def.peers.indexOf(command.word) >= 0) {
						my_type = 'block_terminus';
					}

					switch(my_type) {

						case 'loader':
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
							if (!lang.terminusMatch(command.word, parents.peek().data.type)) {
								throw new Error('Encountered a terminus (' + command.word + ') but expected (' + parents.peek().data.type.replace('#', '/') + ').');
							}
							// If the block_terminus pairs with the parent type,
							// pop the next element off the stack, and make it the parent.
							parents.pop();
							break;

						case 'reserve':
						case 'variable':
						default:
							console.warn('Could not parse command: ', command);
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
		return traverseParseTree(tree.root(), data, '');
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
	function traverseParseTree (node, vars, curr_path, level, options) {

		if (typeof node === 'undefined') {
			console.warn('Cannot resolve undefined parse tree.');
		}
		//
		//   @todo
		//     node instanceof
		
		if (!level) { level = 0; }
		options = options || {
			enable_linked_conditional: false
		}
		var children = node.children,
			offset = Array(level+1).join(' '),
			result = '',
			visit_children = true,
			node_resolve = null;


		// Check the current node's data, and apply it's data, if applicable.
		if (!node.data) {
			// Do nothing.
			options.enable_linked_conditional = false;

			// Nothing to add, so resolve empty. 
			node_resolve = Promise.resolve(result);
		}
		else if (lang.isLoader(node.data.type) === true) {
			var tpl_name = node.data.data.split(':');
			if (tpl_name[0] && vars.__prepcook.templates[tpl_name[0]]) {
				var sub_tpl = vars.__prepcook.templates[tpl_name[0]];
				var sub_tpl_vars = (sub_tpl.vars) ? sub_tpl.vars : vars;
				node_resolve = processTemplate(sub_tpl_vars, sub_tpl.template);
			}
			else {
				// Nothing to add, so resolve empty. 
				node_resolve = Promise.resolve(result);
			}
		}
		else {
			// Do we show the data for this node, or is it a decider for how to show it's children?
			// Constandants and expressions get evaluated.
			if (lang.isConditional(node.data.type) === true) {
				visit_children = lang.resolveConditional(node.data.type, node.data.data, vars, curr_path);

				if (!visit_children) {
					options.enable_linked_conditional = true;	
				}
				else {
					options.enable_linked_conditional = false;
				}
			}
			else if (lang.isLinkedConditional(node.data.type) === true) {

				if (options.enable_linked_conditional === true) {
					visit_children = lang.resolveConditional(node.data.type, node.data.data, vars, curr_path);

					// If conditional failed, allow a linked conditional to fire on the next iteration.
					options.enable_linked_conditional = (visit_children === false) ? true : false;
				}
				else {
					visit_children = false;
				}
			}
			else {
				if (node.data.type == 'constant' || node.data.type == 'expression') {

					// Expressions shouldn't have children.
					visit_children = false;
					result += lang.resolveContent(node.data.type, node.data.data, vars, curr_path);
				}

				// White space shouldn't change state.
				if (node.data.type == 'constant' && node.data.data.trim() == '') {
					// Do not change state for whitespace.
				}
				else {
					options.enable_linked_conditional = false;	
				}
			}

			// Resolve any result that didn't need a promise. 
			node_resolve = Promise.resolve(result);
		}


		// Return a promise, which will evaluate any children, and resolve the final result.
		return new Promise(function(resolve, reject) {

			var child_step_resolve = new Promise(function(resolve, reject) {

				node_resolve.then(function(result) {

					var children_resolve = [];
					children_resolve[0] = Promise.resolve({result: result, options: options});


					if (visit_children === true) {
						// Loops render their decendants more than once, generally.
						if (node.data && lang.isIterator(node.data.type)) {
							curr_vars = parseutil.resolveVarPath(vars, curr_path);

							if (typeof curr_vars[node.data.data] !== 'object') {
								throw new Error('Found iterator on non-object. ' + node.data.data);
							}

							var grandchildren_resolve = [];

							for (var i = 0; i < curr_vars[node.data.data].length; i++) {

								children_resolve[i+1] = new Promise(function(resolve, reject) {
									var my_i = i;

									// Don't resolve the next child until we have the context of the previous.
									children_resolve[my_i].then(function(prev_result) {

										grandchildren_resolve[0] = Promise.resolve(prev_result);

										for (var j = 0; j < children.length; j++) {

											grandchildren_resolve[j+1] = new Promise(function(resolve, reject) {
												// Maintain the state of i and j when this was called.
												var my_j = j,
													my_parent_i = my_i;

												// Once our previous sibling completed, fire ours.
												grandchildren_resolve[my_j].then(function(prev_result) {
													if (children[my_j]) {

														var my_path = (curr_path) ? curr_path + '.' : '';
														my_path += node.data.data + '.' + my_parent_i;
														var my_child_call = traverseParseTree(children[my_j], vars, my_path, (level+1), prev_result.options);

														my_child_call.then(function(temp_result){
															resolve({
																result: prev_result.result + temp_result.result,
																options: temp_result.options
															});
														}).catch(function(err) {
															reject('Error resolving iterator grandchild.', err);
														});
													}
													else {
														reject('No Children in loop for: ', node.data.type);
													}
												});
											});
										}

										// Finalize a complete branch of children's children, and return only a single result.
										Promise.all(grandchildren_resolve).then(function(gc_results){
											var final = gc_results[gc_results.length-1];
											resolve(final);
										}).catch(function(err){
											console.warn('Error parsing children results of an iterator.', err);
											reject(err);
										});
									}).catch(function(err) {
										console.warn('Error in out iterator loop: ', err);
										reject(err);
									});
								});
							}
						}
						// Non-Loops only render once.
						else {
							for (var j = 0; j < children.length; j++) {
								// Return a promise for each element, and don't fire them until the last child is complete, 
								// since we need to build off their state.
								// The first time through, we auto-resolve a promise containing the results from the parent node.
								children_resolve[j+1] = new Promise(function(resolve, reject) {
									var my_j = j;

									// Don't resolve the next child until we have the context of the previous.
									children_resolve[my_j].then(function(prev_result) {

										if (children[my_j]) {
											var my_child_call = traverseParseTree(children[my_j], vars, curr_path, (level+1), prev_result.options);
											
											my_child_call.then(function (temp_result) {
												resolve({
													result: prev_result.result + temp_result.result,
													options: temp_result.options
												});
											}).catch(function(err){
												reject(err);
											});
										}
										else {
											reject('Children not set when detected on node.');
										}
									}).catch(function(err){
										reject(err);
									});
								});
							}
						}

						// When all children are done, then update some settings, and return only the cumlitative result.
						Promise.all(children_resolve).then(function(child_results) {

							// Get the final result (the last promise).
							var final = child_results[child_results.length-1];

							// We will never be in this block if enable_linked_conditional was still TRUE,
							// so protect this state in children from their parents.
							final.options.enable_linked_conditional = false;
							resolve(final);

						}).catch(function(err){
							reject(err);
						});
					}
					// No children, so just resolve the parents.
					else {
						resolve({
							result: result,
							options: options
						});
					}
				});
			});


			// Finalize everything, and resolve the promise we returned.
			child_step_resolve.then(function(child_results) {
				if (level === 0) {
					resolve(child_results.result);
				}
				else {
					resolve ({
						result: child_results.result,
						options: child_results.options
					});	
				}
			}).catch(function(err){
				console.warn('Error finalizing final resolve step in traverseParseTree.', err);
				reject(err);
			});
		});
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
			if (first = parseutil.firstOccuring(lang.reserveWordList(), segment)) {

				var temp = parseutil.splitOnce (segment, first);

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
					if (second = parseutil.firstOccuring(lang.reserveWordList(), segment)) {
						var temp2 = parseutil.splitOnce (segment, second);
						segment = temp2[0];
						remainder = temp2[1] ? second + temp2[1] : second + '';
					}
				}

				if (word = lang.getWord(first)) {

					return {
						type: word.type,
						word: first,
						segment: segment.trim(),
						remainder: remainder
					}
				}
				else {
					throw new Error('Could not find definition for word "' + first + '".');
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
		var temp = parseutil.splitOnce(segment,delimeter_left);				
		
		var left = temp[0],
			segment = '',
			right = (temp[1]) ? temp[1] : '';

		// If we found a start, right should be a block code segment.
		// Split again by end delimeter.
		if (right.length > 0) {
			// Get everything up to our first closing paren,
			// and make it our current_segment.
			// Add remainder as the remaining right.
			temp = parseutil.splitOnce(right,delimeter_right);
			segment = temp[0];
			right = (temp[1]) ? temp[1] : '';
		}

		return {
			left: left,
			segment: segment,
			right: right
		};
	}

	
	return {
		processTemplate: processTemplate,
		bindFunction: prepcookBindFunction,
		bindSubTemplate: prepcookBindSubTemplate
	};
})();

module.exports = {
	processTemplate: chef.processTemplate,
	config: chef.bindFunction,
	bindSubTemplate: chef.bindSubTemplate
};