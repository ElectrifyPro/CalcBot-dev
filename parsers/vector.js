var fraction = require('mathjs').fraction;
var {Parser, Tokenizer} = require('./compiler.js');

var parseNumber = function(tokens, current, parser) {
	var tokensParsed = [tokens[current]];
	
	if (tokens[current].type === 'subtract') {
		if (tokens[current - 1] && (tokens[current - 1].type === 'number' || tokens[current - 1].type === 'name')) { // this is a subtract operator, not part of a number
			return parseOperator(tokens, current, parser);
		} else if (tokens[current + 1] && tokens[current + 1].type === 'number') { // next token is a number
			tokensParsed.push(tokens[current + 1]);
			
			if (tokens[current + 2] && tokens[current + 2].type === 'dot') { // check decimal
				tokensParsed.push(tokens[current + 2]);
				
				if (tokens[current + 3] && tokens[current + 3].type === 'number') {
					tokensParsed.push(tokens[current + 3]);
				} else {
					tokensParsed.splice(current + 2, 1);
				}
			}
			
			return {
				offset: tokensParsed.indexOf(tokens[current]),
				tokensParsed: tokensParsed.length,
				type: 'NumberLiteral',
				value: tokensParsed.reduce((accumulator, currentValue) => accumulator + currentValue.value, ''),
			};
		}
	} else if (tokens[current].type === 'number') {
		if (tokens[current - 1] && tokens[current - 1].type === 'subtract' && (!tokens[current - 2] || (tokens[current - 2].type !== 'number' && tokens[current - 2].type !== 'name'))) { // check negative
			tokensParsed.unshift(tokens[current - 1]);
		}
		
		if (tokens[current + 1] && tokens[current + 1].type === 'dot') { // check decimal
			tokensParsed.push(tokens[current + 1]);
			
			if (tokens[current + 2] && tokens[current + 2].type === 'number') {
				tokensParsed.push(tokens[current + 2]);
			} else {
				tokensParsed.splice(current + 1, 1);
			}
		}
		
		return {
			offset: tokensParsed.indexOf(tokens[current]),
			tokensParsed: tokensParsed.length,
			type: 'NumberLiteral',
			value: tokensParsed.reduce((accumulator, currentValue) => accumulator + currentValue.value, ''),
		};
	}
	
	return undefined;
};

var parseName = function(tokens, current, parser) {
	if (tokens[current].type === 'name') {
		return {
			offset: 0,
			tokensParsed: 1,
			type: 'VectorDefinition',
			value: tokens[current].value,
		};
	}
	
	return undefined;
};

var parseVector = function(tokens, current, parser) {
	var length = 1;
	var tokensParsed = [tokens[current]];
	
	if (tokens[current].type === 'open_paren') {
		for (var i = current; i < tokens.length; ++i) {
			if (tokens[i].type === 'close_paren') {
				if (length !== 2 && length !== 4) {
					return undefined;
				}
				
				tokensParsed.push(tokens[i]);
				
				return {
					length: length,
					offset: 0,
					tokensParsed: tokensParsed.length,
					type: 'VectorLiteral',
					value: tokensParsed.reduce((accumulator, currentValue) => accumulator + currentValue.value, ''),
				};
			} else if (tokens[i].type === 'comma') {
				tokensParsed.push(tokens[i]);
				++length;
			} else {
				var parseResult = parseNumber(tokens, i);
				
				if (parseResult) {
					tokensParsed = tokensParsed.concat(tokens.slice(i, i + parseResult.tokensParsed));
					i += parseResult.tokensParsed - 1 - parseResult.offset;
				}
			}
		}
	}
	
	return undefined;
}

var parseOperator = function(tokens, current, parser) {
	if (['add', 'subtract', 'multiply'].includes(tokens[current].type)) {
		return {
			offset: 0,
			tokensParsed: 1,
			type: 'Operator',
			value: tokens[current].value,
		};
	}
	
	return undefined;
};

var parseNested = function(tokens, current, parser) {
	if (tokens[current].type === 'open_paren') {
		// get the index of the closing parenthesis
		var parenIndex = 0;
		var closingIndex;
		for (closingIndex = current; closingIndex < tokens.length; ++closingIndex) {
			if (tokens[closingIndex].type === 'open_paren') {
				++parenIndex;
			} else if (tokens[closingIndex].type === 'close_paren') {
				--parenIndex;
			}
			
			if (parenIndex === 0) {
				break;
			}
		}
		
		// parse the tokens from the current index to the closing index
		var relevantTokens = tokens.slice(current + 1, closingIndex);
		return {
			body: parser.parse(relevantTokens),
			offset: 0,
			tokensParsed: relevantTokens.length + 2,
			type: 'NestedGroup',
			value: relevantTokens.reduce((accumulator, currentValue) => accumulator + currentValue.value, ''),
		};
	}
	
	return undefined;
};

var parseParenthesis = function(tokens, current, parser) {
	if (['open_paren', 'close_paren'].includes(tokens[current].type)) {
		if (tokens[current].type === 'open_paren') {
			return {
				offset: 0,
				tokensParsed: 1,
				type: 'ParenthesisOpen',
				value: tokens[current].value,
			};
		} else if (tokens[current].type === 'close_paren') {
			return {
				offset: 0,
				tokensParsed: 1,
				type: 'ParenthesisClose',
				value: tokens[current].value,
			};
		}
	}
};

var t = new Tokenizer([{regex: /\s+/, type: 'whitespace'}, {regex: /[a-z]+/i, type: 'name'}, {regex: /\+/, type: 'add'}, {regex: /-/, type: 'subtract'}, {regex: /\*/, type: 'multiply'}, {regex: /,/, type: 'comma'}, {regex: /\(/, type: 'open_paren'}, {regex: /\)/, type: 'close_paren'}, {regex: /\d+/, type: 'number'}, {regex: /\./, type: 'dot'}]);

var p = new Parser(t, [parseNumber, parseName, parseVector, parseOperator, parseNested, parseParenthesis], function(ast) {
	for (var i = 0; i < ast.length; ++i) {
		var current = ast[i];
		var next = ast[i + 1];
		
		if (next && (((current.type === 'NumberLiteral' || current.type === 'VectorLiteral') && (next.type === 'VectorLiteral' || next.type === 'VectorDefinition' || next.type === 'ParenthesisOpen' || next.type === 'NestedGroup')) || ((current.type === 'VectorLiteral' || current.type === 'VectorDefinition' || current.type === 'ParenthesisClose' || current.type === 'NestedGroup') && (next.type === 'NumberLiteral' || next.type === 'VectorLiteral')) || (current.type === 'VectorDefinition' && (next.type === 'VectorLiteral' || next.type === 'NestedGroup')) || ((current.type === 'VectorLiteral' || current.type === 'NestedGroup') && next.type === 'VectorDefinition'))) {
			ast.splice(i + 1, 0, {
				implicit: true,
				offset: 0,
				tokensParsed: 1,
				type: 'Operator',
				value: '*',
			});
			i = -1;
		}
	}
	
	return ast;
});

// evaluation helper functions
var correctValues = function(ast, definedVectors) {
	for (var i = 0; i < ast.length; ++i) {
		if (ast[i].type === 'NumberLiteral') {
			ast[i].value = fraction(ast[i].value).valueOf();
		} else if (ast[i].type === 'VectorLiteral') {
			// get values of vector literal
			var values = ast[i].value.substring(1, ast[i].value.length - 1).split(',');
			
			values.forEach(function(value, index) {
				values[index] = fraction(value).valueOf();
			});
			
			// convert to vector
			if (values.length === 2) {
				ast[i].value = values;
			} else {
				ast[i].value = [values[2] - values[0], values[3] - values[1]];
			}
		} else if (ast[i].type === 'VectorDefinition') {
			// find a defined vector with that name; if it can't be found, throw an error
			if (ast[i].value === 'i' || ast[i].value === 'j') {
				if (ast[i].value === 'i') {
					ast[i] = {
						type: 'VectorLiteral',
						value: [1, 0],
					};
				} else {
					ast[i] = {
						type: 'VectorLiteral',
						value: [0, 1],
					};
				}
			} else {
				var defined = definedVectors.find(function(v) {
					return v.name === ast[i].value;
				});
				
				if (!defined) {
					throw new ReferenceError(ast[i].value + ' is not defined');
				} else {
					var component = defined.component();
					
					ast[i] = {
						type: 'VectorLiteral',
						value: [component.x2, component.y2],
					};
				}
			}
		} else if (ast[i].type === 'NestedGroup') {
			correctValues(ast[i].body, definedVectors);
		}
	}
	
	return ast;
};

var baseEvaluate = function(ast, definedVectors) {
	// look for and evaluate nested groups
	for (var i = 0; i < ast.length; ++i) {
		if (ast[i].type === 'NestedGroup') {
			if (ast[i].body.length === 1) {
				ast[i] = ast[i].body[0];
			} else {
				baseEvaluate(ast[i].body, definedVectors);
			}
		}
	}
	
	// multiply values
	var index = Parser.indexOf('*', ast);
	while (index >= 0) {
		var leftToken = ast[index - 1];
		var rightToken = ast[index + 1];
		
		if (leftToken.type === 'NumberLiteral' && rightToken.type === 'VectorLiteral') { // left scalar
			ast.splice(index - 1, 3, {
				type: 'VectorLiteral',
				value: [rightToken.value[0] * leftToken.value, rightToken.value[1] * leftToken.value],
			});
		} else if (leftToken.type === 'VectorLiteral' && rightToken.type === 'NumberLiteral') { // right scalar
			ast.splice(index - 1, 3, {
				type: 'VectorLiteral',
				value: [leftToken.value[0] * rightToken.value, leftToken.value[1] * rightToken.value],
			});
		} else if (leftToken.type === 'VectorLiteral' && rightToken.type === 'VectorLiteral') { // dot product of two vectors
			ast.splice(index - 1, 3, {
				type: 'NumberLiteral',
				value: leftToken.value[0] * rightToken.value[0] + leftToken.value[1] * rightToken.value[1],
			});
		} else if (leftToken.type === 'NumberLiteral' && rightToken.type === 'NumberLiteral') { // product of two numbers
			ast.splice(index - 1, 3, {
				type: 'NumberLiteral',
				value: leftToken.value * rightToken.value,
			});
		} else if ((leftToken.type === 'VectorLiteral' || leftToken.type === 'NumberLiteral') && rightToken.type === 'NestedGroup') { // distribute left vector / scalar
			var result = [];
			
			for (var i = 0; i < rightToken.body.length; ++i) {
				var token = rightToken.body[i];
				
				if (token.type === 'Operator') {
					result.push(token);
				} else {
					result.push(leftToken, {
						implicit: true,
						type: 'Operator',
						value: '*',
					}, token);
				}
			}
			
			ast.splice(index - 1, 3, ...result);
		} else if (leftToken.type === 'NestedGroup' && (rightToken.type === 'VectorLiteral' || rightToken.type === 'NumberLiteral')) { // distribute right vector / scalar
			var result = [];
			
			for (var i = 0; i < leftToken.body.length; ++i) {
				var token = leftToken.body[i];
				
				if (token.type === 'Operator') {
					result.push(token);
				} else {
					result.push(rightToken, {
						implicit: true,
						type: 'Operator',
						value: '*',
					}, token);
				}
			}
			
			ast.splice(index - 1, 3, ...result);
		}
		
		index = Parser.indexOf('*', ast);
	}
	
	// special case: a subtract token followed by a vector token is equal to -1 * vector
	if (ast.length === 2 && ast[0].value === '-' && ast[1].type === 'VectorLiteral') {
		ast = [{
			type: 'VectorLiteral',
			value: [ast[1].value[0] * -1, ast[1].value[1] * -1],
		}];
	}
	
	// addition and subtraction from left to right
	var index = Parser.indexOf(['+', '-'], ast);
	while (index >= 0) {
		if (Parser.tokensBeside(['+', '-'], ast).every(function(token) {
			return (token.left.type !== 'VectorLiteral' || token.right.type !== 'VectorLiteral') && (token.left.type !== 'NumberLiteral' || token.right.type !== 'NumberLiteral'); // can't add vectors and numbers
		})) {
			break;
		}
		
		var current = ast[index];
		var leftToken = ast[index - 1];
		var rightToken = ast[index + 1];
		
		if (leftToken.type === 'NestedGroup' && rightToken.type === 'NestedGroup') { // add two nested groups
			var result = leftToken.body;
			
			result.push({
				type: 'Operator',
				value: current.value,
			});
			
			result.concat(rightToken.body);
			
			ast.splice(index - 1, 3, result);
		} else if (leftToken.type === 'VectorLiteral' && rightToken.type === 'VectorLiteral') { // add two vectors
			if (current.value === '+') {
				ast.splice(index - 1, 3, {
					type: 'VectorLiteral',
					value: [leftToken.value[0] + rightToken.value[0], leftToken.value[1] + rightToken.value[1]],
				});
			} else if (current.value === '-') {
				ast.splice(index - 1, 3, {
					type: 'VectorLiteral',
					value: [leftToken.value[0] - rightToken.value[0], leftToken.value[1] - rightToken.value[1]],
				});
			}
		} else if (leftToken.type === 'NumberLiteral' && rightToken.type === 'NumberLiteral') { // add two numbers
			if (current.value === '+') {
				ast.splice(index - 1, 3, {
					type: 'NumberLiteral',
					value: leftToken.value + rightToken.value,
				});
			} else if (current.value === '-') {
				ast.splice(index - 1, 3, {
					type: 'NumberLiteral',
					value: leftToken.value - rightToken.value,
				});
			}
		}
		
		index = Parser.indexOf(['+', '-'], ast);
	}
	
	return ast;
};

var baseSimplify = function(ast, definedVectors) {
	for (var i = 0; i < ast.length; ++i) {
		var next = ast[i + 1];
		
		if (ast[i].type === 'NestedGroup') { // look for and simplify nested groups
			baseSimplify(ast[i].body, definedVectors);
		} else if (ast[i].type === 'NumberLiteral') { // remove 0 token
			if (ast.length !== 1 && ast[i].value === 0) {
				ast.splice(i, 1);
				i = -1;
			}
		} else if (ast[i].type === 'Operator') { // remove redundant operators
			if (i === 0 || i === ast.length - 1) { // remove operators at the ends of the tree
				ast.splice(i, 1);
				i = -1;
			} else if (next && ast[i].value === next.value) { // remove double operators
				if (ast[i].value !== '-') {
					ast.splice(i, 1);
					i = -1;
				}
			}
		}
	}
	
	return ast;
};

// combines all the evaluation functions into one
var e = function(exp, definedVectors) {
	var ast = exp;
	
	if (typeof exp === 'string') {
		ast = p.parse(exp, ['whitespace']);
	}
	
	// replace defined vectors and vector literals with their components, and number literals with their true representations
	ast = correctValues(ast, definedVectors);
	
	// evaluate
	ast = baseEvaluate(ast, definedVectors);
	
	// simplify
	ast = baseSimplify(ast, definedVectors);
	
	return ast;
};

module.exports = {
	parse: function(exp) {
		return p.parse(exp, ['whitespace']);
	},
	
	evaluate: e,
};