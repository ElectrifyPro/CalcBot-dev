// a small custom module to get word definitions in most languages

const fetch = require('node-fetch');

/* available language codes:
en 	 English
hi 	 Hindi
es 	 Spanish
fr	 French
ru	 Russian
de 	 German
it 	 Italian
ko 	 Korean
pt-BR 	 Brazilian Portuguese
zh-CN    Chinese (Simplified)
ar       Arabic
tr 	 Turkish
*/
const langCodes = ['en', 'hi', 'es', 'fr', 'ru', 'de', 'it', 'ko', 'pt-BR', 'zh-CN', 'ar', 'tr'];

// Promise.any() currently isn't supported officially, so here's a workaround
var reverse = function(promise) {
    return new Promise((resolve, reject) => Promise.resolve(promise).then(reject, resolve));
};

var promiseAny = function(iterable) {
    return reverse(Promise.all([...iterable].map(reverse)));
};

var cache = [];

module.exports = function(word, language = 'en') {
	if (!langCodes.includes(language)) {
		return Promise.reject('Nonexistent language code.');
	}
	
	var promise1 = new Promise(function(resolve, reject) {
		var inCache = cache.find(function(obj) {
			return obj.word === word && obj.language === language;
		});
		
		if (inCache) {
			resolve(inCache);
		} else {
			reject('Word not in cache.');
		}
	});
	
	var promise2 = fetch(encodeURI('https://api.dictionaryapi.dev/api/v3/entries/' + language + '/' + word))
						.then((res) => res.json())
						.then(function(jsonArr) {
							var obj = jsonArr[0];
							
							if (obj === undefined) {
								return Promise.reject('Word does not exist.');
							}
							
							obj.language = language;
							
							cache.push(obj);
							return obj;
						});
	
	return promiseAny([promise1, promise2]);
};

module.exports.langCodes = langCodes;