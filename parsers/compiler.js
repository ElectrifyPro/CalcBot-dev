class TokenizationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TokenizationError';
	}
}

class ComputationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ComputationError';
	}
}

class Parser {
	constructor(tokenizer, grammar, finishedCallback) {
		this.tokenizer = tokenizer;
		this.grammar = grammar;
		this.finishedCallback = finishedCallback;
	}
	
	parse(string, removeTypes) {
		var tokens = [];
		
		if (typeof string === 'object') {
			tokens = string;
		} else {
			tokens = this.tokenizer.tokenize(string, removeTypes);
		}
		
		var ast = [];
		
		for (var i = 0; i < tokens.length; ++i) {
			for (var j = 0; j < this.grammar.length; ++j) {
				var parseResult = this.grammar[j](tokens, i, this);
				
				if (parseResult) {
					if (Array.isArray(parseResult)) {
						ast = ast.concat(parseResult);
						i += parseResult[parseResult.length - 1].tokensParsed - 1 - parseResult[parseResult.length - 1].offset;
					} else {
						ast.push(parseResult);
						i += parseResult.tokensParsed - 1 - parseResult.offset;
					}
					
					break;
				}
			}
		}
		
		if (this.finishedCallback) {
			ast = this.finishedCallback(ast);
		}
		
		return ast;
	}
	
	// returns the index of a token value in an abstract syntax tree
	static indexOf(value, ast, startIndex = 0) {
		for (var i = startIndex; i < ast.length; ++i) {
			if ((typeof value === 'object' && value.includes(ast[i].value)) || (typeof value === 'string' && ast[i].value === value)) {
				return i;
			}
		}
		
		return -1;
	}
	
	// returns all unique combinations of tokens on either side of a specified one's value
	static tokensBeside(value, ast) {
		var combos = [];
		
		for (var i = 0; i < ast.length; ++i) {
			if ((typeof value === 'object' && value.includes(ast[i].value)) || (typeof value === 'string' && ast[i].value === value)) {
				combos.push({
					left: ast[i - 1],
					right: ast[i + 1],
				});
			}
		}
		
		return combos.filter((elem, index) => combos.indexOf(elem) === index);
	}
}

class Tokenizer {
	// tokens is an array of objects like this:
	/*
	{
		regex: /\(/,
		type: 'paren',
	}
	*/
	constructor(tokens, finishedCallback) {
		this.tokens = tokens;
		this.finishedCallback = finishedCallback;
	}
	
	// allows you to remove certain types from the token result
	tokenize(string, removeTypes = []) {
		var tokensFound = [];
		
		for (var i = 0; i < string.length; ++i) {
			var matched = false;
			var remaining = string.substring(i, string.length);
			
			for (var j = 0; j < this.tokens.length; ++j) {
				var tokenDef = this.tokens[j];
				var match = remaining.match(tokenDef.regex);
				
				// successful
				if (match && match.index === 0) {
					var obj = {
						type: tokenDef.type,
						value: match[0]
					};
					
					if (match.length > 1) {
						obj.groups = match.splice(1, match.length);
					}
					
					tokensFound.push(obj);
					
					matched = true;
					i += match[0].length - 1;
					
					break;
				}
			}
			
			if (!matched) {
				throw new TypeError('Failed to match remaining string: "' + remaining + '"');
			}
		}
		
		if (this.finishedCallback) {
			tokensFound = this.finishedCallback(tokensFound);
		}
		
		return tokensFound.filter(function(token) {
			return !removeTypes.includes(token.type);
		});
	}
}

module.exports = {
	TokenizationError: TokenizationError,
	ComputationError: ComputationError,
	
	Parser: Parser,
	Tokenizer: Tokenizer,
};