var lang = (function languageFactory() {
	
	var reserve_word_list = [
		'#each',
		'/each',
		'#if',
		'/if',
		'#else',
		'unless',
		'/unless'
	];

	var dictionary = {
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
				end: '/if'
			},
		'#unless': {
				type: 'block',
				behavior: 'conditional',
				start: '#unless',
				end: '/unless'
			}
	};

	function getWordList() {
		return reserve_word_list;
	}

	function getWordDefinition(word) {
		
		var my_word = word.replace('/', '#');

		if (dictionary[my_word]) {
			return {
				type: dictionary[my_word].type,
				behavior: (my_word == word) ? dictionary[my_word].type : 'terminus',
				start: dictionary[my_word].start,
				end: dictionary[my_word].end
			}
		}
		return false;
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
		terminusMatch: terminusMatch
	};
})();

module.exports = {
	reserveWordList: lang.getWordList,
	getWord: lang.getWord,
	terminusMatch: lang.terminusMatch
};