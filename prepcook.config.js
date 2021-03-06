/**
 * Initialize constants that can be include elsewhere.
 *
 * @see  http://stackoverflow.com/a/8596808/938281
 */
function define(name, value) {
	Object.defineProperty(exports, name, {
		value: value,
		enumerable: true
	});
}


// Our default error returned when something fails. Instead of passing an error back,
// a function will return this as the value, in cases where we don't want to throw an Error.
define('BISTRO_FAILURE', '__FAILURE');