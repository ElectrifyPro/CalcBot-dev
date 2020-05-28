// fun section lol

var possibilites = function(v = 3) {
	var k = (1 << v);
	
	var truths = [];

	for (var i = 0; i < k; ++i) {
		truths[i] = [];
		
		for (var j = 0; j < v; ++j) {
			var value = (i >> j) & 1; // extract the j-th bit of i
			truths[i][j] = value;
		}
	}
	
	return truths;
};

var truthTable = function(str, str2) {
	var characters = (str + ' ' + str2).match(/[A-Za-z]+/g).filter((letter, index, arr) => index === arr.indexOf(letter));
	
	var tests = [
		{a: true, b: true, c: true},
		{a: true, b: true, c: false},
		{a: true, b: false, c: true},
		{a: true, b: false, c: false},
		{a: false, b: true, c: true},
		{a: false, b: true, c: false},
		{a: false, b: false, c: true},
		{a: false, b: false, c: false},
	];
	
	if (!str2) {
		console.log('a', 'b', 'c', 'result');
		for (var i = 0; i < tests.length; ++i) {
			console.log(tests[i].a, tests[i].b, tests[i].c, eval('var a = ' + tests[i].a + ';var b = ' + tests[i].b + ';var c = ' + tests[i].c + ';' + str));
		}
	} else {
		for (var i = 0; i < tests.length; ++i) {
			if (eval('var a = ' + tests[i].a + ';var b = ' + tests[i].b + ';var c = ' + tests[i].c + ';' + str) !== eval('var a = ' + tests[i].a + ';var b = ' + tests[i].b + ';var c = ' + tests[i].c + ';' + str2)) {
				return false;
			}
		}
		
		return true;
	}
};

var Discord = require('discord.js');
var words = require('an-array-of-english-words');
var esrever = require('esrever');

// implementation of levenshtein distance algorithm
var levenshtein = function(s, t) {
	var d = []; // 2D matrix
	
	// Step 1
	var n = s.length;
	var m = t.length;
	
	if (n == 0) {
		return m;
	}
	
	if (m == 0) {
		return n;
	}
	
	for (var i = n; i >= 0; --i) {
		d[i] = [];
	}
	
	// Step 2
	for (var i = n; i >= 0; --i) {
		d[i][0] = i;
	}
	
	for (var j = m; j >= 0; --j) {
		d[0][j] = j;
	}
	
	// Step 3
	for (var i = 1; i <= n; ++i) {
		var s_i = s.charAt(i - 1);
		
		// Step 4
		for (var j = 1; j <= m; ++j) {
			// check jagged ld total so far
			if (i == j && d[i][j] > 4) {
				return n;
			}
			
			var t_j = t.charAt(j - 1);
			var cost = (s_i == t_j) ? 0 : 1; // Step 5
			
			// calculate minimum
			var mi = d[i - 1][j] + 1;
			var b = d[i][j - 1] + 1;
			var c = d[i - 1][j - 1] + cost;
			
			if (b < mi) {
				mi = b;
			}
			
			if (c < mi) {
				mi = c;
			}
			
			d[i][j] = mi; // Step 6
			
			// damerau transposition
			if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
				d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
			}
		}
	}
	
	// Step 7
	return d[n][m];
};

// returns an object containing the counts of every character in a string
var counts = function(str) {
	var counts = {};
	
	for (var i = 0; i < str.length; ++i) {
		if (counts[str[i]] === undefined) {
			counts[str[i]] = 1;
		} else {
			++counts[str[i]];
		}
	}
	
	return counts;
};

// given an object containing the counts of the user input word and the counts of a word, check if inCounts can be unscrambled into dictCounts
var inputInDict = function(inCounts, dictCounts) {
	// all keys (letters) in dictCounts MUST be present in inCounts
	if (Object.keys(dictCounts).find(function(key) {
			return inCounts[key] === undefined;
		}) !== undefined) {
		return false;
	}
	
	// all keys in inCounts MUST appear the same amount or more times as its corresponding key in dictCounts
	if (Object.keys(inCounts).find(function(key) {
			return inCounts[key] < dictCounts[key];
		}) !== undefined) {
		return false;
	}
	
	return true;
};

module.exports = {
	// converts every L / R in an input to W
	aegyo: function(input) {
		var result = input.split('');
		
		for (var i = 0; i < result.length; ++i) {
			var current = result[i];
			
			if (current === 'l' || current === 'r') {
				result[i] = 'w';
			} else if (current === 'L' || current === 'R') {
				result[i] = 'W';
			}
		}
		
		return result.join('');
	},
	
	// find the words closest to the input (spell check)
	closest: function(input) {
		var foundWords = [];
		var min = Number.MAX_SAFE_INTEGER;
		
		words.forEach(function(dictWord) {
			var dist = levenshtein(input, dictWord);
			
			if (dist < min) {
				foundWords = [dictWord];
				min = dist;
			} else if (dist === min) {
				foundWords.push(dictWord);
			}
		});
		
		return foundWords;
	},
	
	// parses a string of properties that describe an embed
	embed: function(str, users) {
		var properties = [...str.matchAll(/\s*([^,]+?)\s*\:\s*([^,]+)/g)];
		var embed = new Discord.MessageEmbed();
		
		properties.forEach(function(p) {
			if (p[1] === 'author.name') {
				if (embed.author === null) {
					embed.author = {};
				}
				
				embed.author.name = p[2];
			} else if (p[1] === 'author.icon') {
				if (embed.author === null) {
					embed.author = {};
				}
				
				if (/(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))?/g.test(p[2])) {
					embed.author.iconURL = p[2];
				} else if (/<@!?\d+>/.test(p[2])) {
					var user = users.resolve(p[2].match(/\d+/)[0]);
					embed.author.iconURL = user.displayAvatarURL();
				} else {
					var user = users.cache.find((user) => user.username === p[2]);
					embed.author.iconURL = user.displayAvatarURL();
				}
			} else if (p[1] === 'author.url') {
				if (embed.author === null) {
					embed.author = {};
				}
				
				embed.author.url = p[2];
			} else if (p[1] === 'color') {
				embed[p[1]] = Discord.resolveColor(p[2]);
			} else {
				embed[p[1]] = p[2];
			}
		});
		
		console.log(embed);
		
		return embed;
	},
	
	// implementation of levenshtein distance algorithm
	levenshtein: levenshtein,
	
	// randon number
	random: function(min, max) {
		if (max === undefined) { // 0 to max
			return Math.floor(Math.random() * Math.floor(min));
		} else { // min to max
			return Math.floor(Math.random() * Math.floor(max - min)) + min;
		}
	},
	
	// reverse a string (unicode-aware)
	reverse: function(str) {
		var result = esrever.reverse(str);
		
		// fix mentions
		result = result.replace(/>(\d+)!?(@|#)</g, function(match, id, symbol) {
			return '<' + symbol + id.split('').reverse().join('') + '>';
		});
		
		return result;
	},
	
	// scramble a word
	scramble: function(word) {
		word = word.split('');
		var num = 0;
		var scramble = '';
		
		while (word.length > 0) {
			num = word.length * Math.random() << 0;
			
			scramble += word[num];
			
			word.splice(num, 1);
		}
		
		return scramble;
	},
	
	// randomly capitalizes a string
	uglify: function(str) {
		var arr = str.split('');
		var mode = 0;
		
		for (var i = 0; i < arr.length; ++i) {
			if (/[A-Za-z]/.test(arr[i])) {
				if (mode === 0) {
					arr[i] = arr[i].toLowerCase();
					mode = 1;
				} else {
					arr[i] = arr[i].toUpperCase();
					mode = 0;
				}
			}
		}
		
		return arr.join('');
	},
	
	// unscramble a word
	unscramble: function(word, wordLength) {
		if (wordLength === undefined) {
			wordLength = word.length;
		}
		
		wordLength = Number(wordLength);
		
		word = word.toLowerCase();
		
		var matches = [];
		
		var sortedWord = word.split('').sort().join('');
		var sortedCounts = counts(sortedWord);
		
		words.forEach(function(dictWord) {
			if (matches.length >= 100) {
				return;
			}
			
			var dictCounts = counts(dictWord);
			
			if (dictWord.length === wordLength && inputInDict(sortedCounts, dictCounts)) {
				matches.push(dictWord);
			}
		});
		
		return matches;
	},
};