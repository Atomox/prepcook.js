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
				start: 'unless',
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

	return {
		getWordList: getWordList,
		getWord: getWordDefinition
	};
})();

module.exports = {
	reserveWordList: lang.getWordList,
	getWord: lang.getWord
};