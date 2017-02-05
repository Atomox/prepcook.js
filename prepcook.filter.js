/**
 * @file
 *   prepcook.filter
 *
 *   This module contains filter/format functions for formatting tokens
 *   from prepcook.token.js.
 */

var parseutil = parseutil || require('./includes/prepcook.utils');

const BISTRO_FAILURE = BISTRO_FAILURE || '__FAILURE';


var prepcookFilter = (function FilterFactory() {

	/**
	 * Format a number as the given currency format.
	 *
	 * @see https://www.currency-iso.org/en/home/tables/table-a1.html
	 *   for currency codes.
	 * 
	 * @param  {number} number
	 *   The number to be formatted. May be into or decimal.
	 * @param  {string} type
	 *   The type of currency this should be formatted to.
	 *   
	 * @return {string}
	 *   The number, formatted to the passed currency [type],
	 *   if supported. At worst, the original number passed.
	 */
	function filterCurrency (number, type) {

		console.log('filterCurrency: ', number, ',', type);

		var symbol = '',
			dec = 2;

		switch (type) {

			case 'USD':
			case 'EUR':
			case 'GBP':
			case 'JPY':
			case 'INR':
			case 'CNY':
				break;

			default:
				console.warn(type + ' is not a recgonized currency format.');
				return number;
		}

		return number.toLocaleString('en-US', {style: 'currency', minimumFractionDigits: dec, currency: type});
	}


	/**
	 * Given a date, format as the passed [format].
	 * 
	 * @param  {date} date
	 *   A date to format.
	 * @param  {string} format
	 *   A format which we should apply to our [date].
	 * 
	 * @return {string}
	 *   Our [date], in the specified format.
	 */
	function filterDate (date, format) {

		try {
			if (typeof date !== 'string') {
				throw new Error('Date passed to filterDate expected string, ' + typeof date + ' given.');
			}
			var d = new Date(date);	

	


			/**
			   

			   @TODO


			 */




			// Allowed formats: 'Y-M-D'...
			date = d;
		}
		catch (error) {
			console.warn('Error formatting date. ', err);
			return BISTRO_FAILURE;
		}

		return date;
	}


	/**
	 * Filter a list of data by a [filter].
	 * 
	 * @param  {mixed} data
	 *   Some data to filter.
	 * @param  {string} filter
	 *   A filter command to apply to our data.
	 *   
	 * @return {mixed}
	 *   Our data, with only the elements not removed by the applied [filter].
	 */
	function filterFilter (data, filter) {

		/**
		   

		   @TODO


		 */

		return data;
	}


	/**
	 * Filter a string to lowercase
	 * 
	 * @param  {string} data
	 *   A string to convert to lowercase.
	 *   
	 * @return {string}
	 *   A string, lowercased. If passed type was not a string, it is returned as-is.
	 */
	function filterLowercase (data) {
		if (typeof data !== 'string') {
			console.warn('Lowercase filter expects string. ' + typeof data + ' given.');
			return data;
		}
		return data.toLowerCase();
	}


	/**
	 * Filter a string to uppercase
	 * 
	 * @param  {string} data
	 *   A string to convert to uppercase.
	 *   
	 * @return {string}
	 *   A string, uppercased. If passed type was not a string, it is returned as-is.
	 */
	function filterUppercase (data) {
		if (typeof data !== 'string') {
			console.warn('Uppercase filter expects string. ' + typeof data + ' given.');
			return data;
		}
		return data.toUpperCase();
	}


	/**
	   
	   @TODO

	 * @param  {mixed} object
	 *   Some variables or object to convert to JSON.
	 * 
	 * @return {JSON}
	 *   Our data, in JSON format.
	 */
	function filterToJSON (object) {
		return JSON.stringify(object);
	}

	return {
		currency: filterCurrency,
		date: filterDate,
		json: filterToJSON,
		filter: filterFilter,
		uppercase: filterUppercase,
		lowercase: filterLowercase
	};
})();

module.exports = {
	currency: prepcookFilter.currency,
	date: prepcookFilter.date,
	json: prepcookFilter.json,
	filter: prepcookFilter.filter,
	uppercase: prepcookFilter.uppercase,
	lowercase: prepcookFilter.lowercase
};