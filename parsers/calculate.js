/*var {create, all} = require('mathjs');
var mJS = create(all);

mJS.config({
	number: 'BigNumber',
	precision: 64,
});*/
var mJS = require('mathjs');

var {Parser, Tokenizer} = require('./compiler.js');

// creates a deep copy of an object
var deepCopy = function(obj) {
	var value;
	
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}
	
	var out = Array.isArray(obj) ? [] : {};
	
	for (var key in obj) {
		var value = obj[key];
		
		// recursive deep copy for nested objects / arrays
		out[key] = deepCopy(value);
	}
	
	return out;
};

/**
MATH FUNCTIONS
**/
var m = 'radian';

var sin = function(a) {
	return mJS.sin(m === 'degree' ? dtr(a) : a);
};

var cos = function(a) {
	return mJS.cos(m === 'degree' ? dtr(a) : a);
};

var tan = function(a) {
	return mJS.tan(m === 'degree' ? dtr(a) : a);
};

var csc = function(a) {
	return mJS.csc(m === 'degree' ? dtr(a) : a);
};

var sec = function(a) {
	return mJS.sec(m === 'degree' ? dtr(a) : a);
};

var cot = function(a) {
	return mJS.cot(m === 'degree' ? dtr(a) : a);
};

var asin = function(r) {
	return m === 'degree' ? rtd(mJS.asin(r)) : mJS.asin(r);
};

var acos = function(r) {
	return m === 'degree' ? rtd(mJS.acos(r)) : mJS.acos(r);
};

var atan = function(r) {
	return m === 'degree' ? rtd(mJS.atan(r)) : mJS.atan(r);
};

var asec = function(r) {
	return m === 'degree' ? rtd(mJS.asec(r)) : mJS.asec(r);
};

var acsc = function(r) {
	return m === 'degree' ? rtd(mJS.acsc(r)) : mJS.acsc(r);
};

var acot = function(r) {
	return m === 'degree' ? rtd(mJS.acot(r)) : mJS.acot(r);
};

// degrees to radians
var dtr = function(d) {
	return d * Math.PI / 180;
};

// radians to degrees
var rtd = function(r) {
	return r * 180 / Math.PI;
};

// logarithm base x of y
var log = function(x, y = 10) {
	if (y <= 0) {
		return NaN;
	}
	
	return Math.log(x) / Math.log(y);
};

// natural logarithm
var ln = function(e) {
	return Math.log(e);
};

var sqrt = function(n) {
	return pow(n, 1 / 2);
};

var cbrt = function(n) {
	return pow(n, 1 / 3);
};

// take ith root of n
// root(2, 16) = sqrt(16)
var root = function(i, n) {
	return pow(n, 1 / i);
};

// returns a * 10 ^ b
var scientific = function(a, b) {
	return a * mJS.pow(10, b);
};

var pow = function(n, p) {
	if (typeof n === 'object' || typeof p === 'object') {
		if (typeof n === 'object' && typeof p === 'object') {
			var result = mJS.pow(mJS.complex(n.real, n.imaginary), mJS.complex(p.real, p.imaginary));
			
			if (typeof result === 'object') {
				var imaginary = mJS.fraction(result.im).valueOf();
				var real = mJS.fraction(result.re).valueOf();
				
				if (imaginary === 0) {
					return real;
				} else {
					return {
						type: 'ComplexLiteral',
						real: real,
						imaginary: imaginary,
					};
				}
			} else {
				return result;
			}
		} else if (typeof n === 'object') {
			// no need to compute if it's just i^2, i^3, etc.
			if (n.imaginary === 1 && n.real === 0) {
				if (p % 4 === 0) {
					return 1;
				} else if (p % 3 === 0) {
					return {
						type: 'ComplexLiteral',
						real: 0,
						imaginary: -1 * polarity(p),
					};
				} else if (p % 2 === 0) {
					return -1;
				} else if (p % 1 === 0) {
					return {
						type: 'ComplexLiteral',
						real: 0,
						imaginary: 1 * polarity(p),
					};
				}
			}
			
			var r = sqrt(pow(n.real, 2) + pow(n.imaginary, 2));
			return {
				type: 'ComplexLiteral',
				real: mJS.fraction(pow(r, p) * cos(p * atan(n.imaginary / n.real))).valueOf(),
				imaginary: mJS.fraction(pow(r, p) * sin(p * atan(n.imaginary / n.real))).valueOf(),
			};
		} else if (typeof p === 'object') {
			return {
				type: 'ComplexLiteral',
				real: pow(n, p.real) * cos(p.imaginary * ln(n)),
				imaginary: pow(n, p.real) * sin(p.imaginary * ln(n)),
			};
		}
	}
	
	var result = mJS.pow(n, p);
	
	if (typeof result === 'object') {
		return {
			type: 'ComplexLiteral',
			real: mJS.fraction(result.re).valueOf(),
			imaginary: mJS.fraction(result.im).valueOf(),
		};
	} else {
		return result;
	}
};

var factorial = function(num) {
	if (num <= 1) {
		return 1;
	} else {
		return num * factorial(num - 1);
	}
};

// absolute value
var abs = function(n) {
	return mJS.abs(n);
};

// round up to nearest __ (default integer)
var ceil = function(n, s) {
	if (s === undefined) {
		return mJS.ceil(n);
	} else {
		var inv = 1.0 / s;
		return mJS.ceil(n * inv) / inv;
	}
};

// round down to nearest __ (default integer)
var floor = function(n, s) {
	if (s === undefined) {
		return mJS.floor(n);
	} else {
		var inv = 1.0 / s;
		return mJS.floor(n * inv) / inv;
	}
};

// round to nearest __ (default integer)
var round = function(n, s) {
	if (s === undefined) {
		return mJS.round(n);
	} else {
		var inv = 1.0 / s;
		return mJS.round(n * inv) / inv;
	}
};

// clamp a number to a given range
var clamp = function(n, l, r) {
	if (n < l) {
		return l;
	} else if (n > r) {
		return r;
	}
	
	return Number(n);
};

// returns true if a number is prime
var prime = function(num) {
	for (var i = 2; i < round(num / 2) + 1; ++i) {
		if (num % i === 0) {
			return false;
		}
	}
	
	return true;
};

// returns polarity of a number
var polarity = function(num) {
	if (num < 0) {
		return -1;
	} else if (num > 0) {
		return 1;
	}
	
	return 0;
};

/**
PARSING
**/

// format an array into a comma-separated list
var listFormat = function(arr, prefixElem = '', suffixElem = '', finalConnector = 'and') {
	var str = '';
	
	arr.forEach(function(elem, index) {
		str += prefixElem + elem + suffixElem + (index < arr.length - 1 && arr.length > 2 ? ', ' : ' ') + (index === arr.length - 2 ? finalConnector + ' ' : '');
	});
	
	return str.trim();
};

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

var parseNumber = function(tokens, current, parser) {
	var tokensParsed = [tokens[current]];
	
	if (tokens[current] && tokens[current].type === 'dot') { // decimal number
		if (tokens[current + 1] && tokens[current + 1].type === 'number') {
			tokensParsed.push(tokens[current + 1]);
			
			return {
				offset: tokensParsed.indexOf(tokens[current]),
				tokensParsed: tokensParsed.length,
				type: 'NumberLiteral',
				value: tokensParsed.reduce((accumulator, currentValue) => accumulator + currentValue.value, ''),
			};
		}
	} else if (tokens[current].type === 'number') {
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
		if (tokens[current + 1] && tokens[current + 1].type === 'open_paren') { // function call
			return parseFunctionCall(tokens, current, parser);
		}
		
		return {
			offset: 0,
			tokensParsed: 1,
			type: 'VariableName',
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

var parseFunctionCall = function(tokens, current, parser) {
	if (tokens[current].type === 'name' && tokens[current + 1] && tokens[current + 1].type === 'open_paren') {
		// get the index of the closing parenthesis
		var lastParamStart = current + 2;
		var parameters = [];
		var parenIndex = 0;
		var closingIndex;
		for (closingIndex = current + 1; closingIndex < tokens.length; ++closingIndex) {
			if (tokens[closingIndex].type === 'open_paren') {
				++parenIndex;
			} else if (tokens[closingIndex].type === 'close_paren') {
				--parenIndex;
			}
			
			if (parenIndex === 1 && tokens[closingIndex].type === 'comma') {
				parameters.push(tokens.slice(lastParamStart, closingIndex));
				lastParamStart = closingIndex + 1;
			}
			
			if (parenIndex === 0) {
				parameters.push(tokens.slice(lastParamStart, closingIndex));
				break;
			}
		}
		
		if (parameters.length === 1 && parameters[0].length === 0) {
			parameters = [];
		}
		
		// parse each paremeter's tokens
		for (var i = 0; i < parameters.length; ++i) {
			parameters[i] = parser.parse(parameters[i]);
		}
		
		return {
			parameters: parameters,
			name: tokens[current].value,
			offset: 0,
			tokensParsed: closingIndex - current + 1,
			type: 'FunctionCall',
		};
	};
	
	return undefined;
};

var parseOperator = function(tokens, current, parser) {
	if (['add', 'subtract', 'multiply', 'divide', 'modulo', 'exponent', 'factorial'].includes(tokens[current].type)) {
		return {
			offset: 0,
			tokensParsed: 1,
			type: 'Operator',
			value: tokens[current].value,
		};
	}
	
	return undefined;
};

var reverseSuperscripts = {
	0: '⁰',
	1: '¹',
	2: '²',
	3: '³',
	4: '⁴',
	5: '⁵',
	6: '⁶',
	7: '⁷',
	8: '⁸',
	9: '⁹',
	'+': '⁺',
	'-': '⁻',
};

var superScripts = {
	'⁰': 0,
	'¹': 1,
	'²': 2,
	'³': 3,
	'⁴': 4,
	'⁵': 5,
	'⁶': 6,
	'⁷': 7,
	'⁸': 8,
	'⁹': 9,
	'⁺': '+',
	'⁻': '-',
};

var normalToSuper = function(str) {
	return str.replace(/[\d\+\-]/g, (match) => reverseSuperscripts[match]);
};

var superToNormal = function(str) {
	return str.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, (match) => superScripts[match]);
};

var parseSuper = function(tokens, current, parser) {
	var tokensParsed = [];
	
	if (tokens[current].type.startsWith('super_')) {
		// collect adjacent superscript tokens
		for (var i = current; i < tokens.length; ++i) {
			if (tokens[i].type.startsWith('super_')) {
				tokensParsed.push(tokens[i]);
			} else {
				break;
			}
		}
		
		// convert to normal token
		for (var i = 0; i < tokensParsed.length; ++i) {
			tokensParsed[i].value = superToNormal(tokensParsed[i].value);
			
			if (tokensParsed[i].value === '+') {
				tokensParsed[i].type = 'add';
			} else if (tokensParsed[i].value === '-') {
				tokensParsed[i].type = 'subtract';
			} else {
				tokensParsed[i].type = 'number';
			}
		}
		
		// parse them as a raised exponent
		return [
			{
				type: 'Operator',
				value: '^',
			},
			{
				body: parser.parse(tokensParsed),
				offset: 0,
				tokensParsed: tokensParsed.length,
				type: 'NestedGroup',
				value: tokensParsed.reduce((accumulator, currentValue) => accumulator + currentValue.value, ''),
			},
		];
	}
	
	return undefined;
};

var parseSymbol = function(tokens, current, parser) {
	if (tokens[current].type === 'symbol') {
		if (tokens[current].value === '×' || tokens[current].value === '·') {
			return {
				offset: 0,
				tokensParsed: 1,
				type: 'Operator',
				value: '*',
			};
		} else if (tokens[current].value === '÷') {
			return {
				offset: 0,
				tokensParsed: 1,
				type: 'Operator',
				value: '/',
			};
		} else if (tokens[current].value === 'τ') {
			return {
				offset: 0,
				tokensParsed: 1,
				type: 'VariableName',
				value: 'tau',
			};
		} else if (tokens[current].value === 'π') {
			return {
				offset: 0,
				tokensParsed: 1,
				type: 'VariableName',
				value: 'pi',
			};
		} else if (tokens[current].value === 'φ') {
			return {
				offset: 0,
				tokensParsed: 1,
				type: 'VariableName',
				value: 'phi',
			};
		} else {
			throw new TokenizationError('Unrecognized token: `' + tokens[current].value + '`');
		}
	}
	
	return undefined;
};



var functions = {
	sin: {f: sin, c: [1]},
	cos: {f: cos, c: [1]},
	tan: {f: tan, c: [1]},
	csc: {f: csc, c: [1]},
	sec: {f: sec, c: [1]},
	cot: {f: cot, c: [1]},
	asin: {f: asin, c: [1]},
	acos: {f: acos, c: [1]},
	atan: {f: atan, c: [1]},
	asec: {f: asec, c: [1]},
	acsc: {f: acsc, c: [1]},
	acot: {f: acot, c: [1]},
	dtr: {f: dtr, c: [1]},
	rtd: {f: rtd, c: [1]},
	log: {f: log, c: [1, 2]},
	ln: {f: ln, c: [1]},
	sqrt: {f: sqrt, c: [1]},
	cbrt: {f: cbrt, c: [1]},
	root: {f: root, c: [2]},
	scientific: {f: scientific, c: [2]},
	pow: {f: pow, c: [2]},
	factorial: {f: factorial, c: [1]},
	abs: {f: abs, c: [1]},
	ceil: {f: ceil, c: [1, 2]},
	floor: {f: floor, c: [1, 2]},
	round: {f: round, c: [1, 2]},
	clamp: {f: clamp, c: [3]},
	polarity: {f: polarity, c: [1]},
};

var implicitRules = {
	close_paren: ['number', 'name', 'open_paren'],
	number: ['name', 'open_paren'],
	name: ['number', 'open_paren'],
};

var t = new Tokenizer([{regex: /\s+/, type: 'whitespace'}, {regex: /[a-z]+/i, type: 'name'}, {regex: /⁺/, type: 'super_add'}, {regex: /\+/, type: 'add'}, {regex: /⁻/, type: 'super_subtract'}, {regex: /-/, type: 'subtract'}, {regex: /\*/, type: 'multiply'}, {regex: /\//, type: 'divide'}, {regex: /%/, type: 'modulo'}, {regex: /\^/, type: 'exponent'}, {regex: /!/, type: 'factorial'}, {regex: /,/, type: 'comma'}, {regex: /\(/, type: 'open_paren'}, {regex: /\)/, type: 'close_paren'}, {regex: /[⁰¹²³⁴⁵⁶⁷⁸⁹]+/, type: 'super_number'}, {regex: /\d+/, type: 'number'}, {regex: /\./, type: 'dot'}, {regex: /./, type: 'symbol'}], function(tokens) {
	// closing parenthesis
	var open = 0;
	var close = 0;
	for (var i = 0; i < tokens.length; ++i) {
		if (tokens[i].type === 'open_paren') {
			++open;
		} else if (tokens[i].type === 'close_paren') {
			++close;
		}
	}
	
	if (open > close) {
		tokens.fill({type: 'close_paren', value: ')'}, tokens.length, open - close);
	} else if (close > open) {
		tokens = new Array(close - open).fill({type: 'open_paren', value: '('}).concat(tokens);
	}
	
	// implicit multiplication
	for (var i = 0; i < tokens.length; ++i) {
		var current = tokens[i];
		var next = tokens[i + 1];
		
		if (!functions[current.value] && next && implicitRules[current.type] && implicitRules[current.type].includes(next.type)) {
			tokens.splice(i + 1, 0, {
				type: 'multiply',
				value: '*',
			});
			++i;
		}
	}
	
	return tokens;
});

var p = new Parser(t, [parseNumber, parseName, parseNested, parseFunctionCall, parseOperator, parseSuper, parseSymbol]);

// evaluation helper functions
var correctValues = function(ast, calcVars) {
	for (var i = 0; i < ast.length; ++i) {
		if (ast[i].type === 'NumberLiteral') {
			ast[i].value = parseFloat(ast[i].value);
		} else if (ast[i].type === 'VariableName') {
			// get values of vector literal
			if (calcVars[ast[i].value] !== undefined) {
				if (typeof calcVars[ast[i].value] === 'object') {
					ast[i] = calcVars[ast[i].value];
				} else {
					ast[i] = {
						type: 'NumberLiteral',
						value: calcVars[ast[i].value],
					};
				}
			} else {
				throw new ReferenceError('`' + ast[i].value + '` is not defined');
			}
		} else if (ast[i].type === 'FunctionCall') {
			for (var j = 0; j < ast[i].parameters.length; ++j) {
				ast[i].parameters[j] = correctValues(ast[i].parameters[j], calcVars);
			}
		} else if (ast[i].type === 'NestedGroup') {
			ast[i].body = correctValues(ast[i].body, calcVars);
		}
	}
	
	return ast;
};

var baseEvaluate = function(ast, calcVars, trigMode, current) {
	var steps = [];
	steps.current = current;
	
	// P: Parenthesis
	// look for and evaluate nested groups
	for (var i = 0; i < ast.length; ++i) {
		if (ast[i].type === 'NestedGroup') {
			if (ast[i].body.length === 1) {
				ast[i] = ast[i].body[0];
			} else {
				var evaluation = baseEvaluate(ast[i].body, calcVars, trigMode, 'group');
				steps.push(evaluation.steps);
				
				if (evaluation.ast.length > 1) {
					throw new SyntaxError('There were too many nodes in the resulting tree.');
				}
				
				ast[i] = evaluation.ast[0];
			}
		}
	}
	
	// look for and evaluate function calls
	for (var i = 0; i < ast.length; ++i) {
		if (ast[i].type === 'FunctionCall') {
			var paramEvaluation = [];
			
			if (functions[ast[i].name].c.includes(ast[i].parameters.length)) {
				for (var j = 0; j < ast[i].parameters.length; ++j) {
					var result = baseEvaluate(ast[i].parameters[j], calcVars, trigMode, 'function ' + ast[i].name);
					
					if (result.ast[0].type === 'NumberLiteral') {
						if (!isFinite(result.ast[0].value)) {
							throw new ComputationError('The answer does not exist, or was too large to display.');
						}
						
						result.value = result.ast[0].value;
					} else if (result.ast[0].type === 'ComplexLiteral') {
						result.value = result.ast[0];
					}
					
					paramEvaluation[j] = result.value;
				}
				
				var ans = functions[ast[i].name].f(...paramEvaluation);
				
				steps.push('Result of ' + ast[i].name + ' function = ' + ans);
				
				if (typeof ans === 'object') {
					ast[i] = ans;
				} else {
					ast[i] = {
						type: 'NumberLiteral',
						value: ans,
					};
				}
			} else {
				throw new ComputationError('The `' + ast[i].name + '` function takes ' + listFormat(functions[ast[i].name].c, '', '', 'or') + ' parameter' + (functions[ast[i].name].c.length === 1 ? '' : 's') + ', not ' + ast[i].parameters.length + '.');
			}
		}
	}
	
	// factorial comes first woo
	var index = Parser.indexOf('!', ast);
	while (index >= 0) {
		var current = ast[index];
		var leftToken = ast[index - 1];
		
		if (leftToken === undefined) {
			throw new ComputationError('The `!` operator requires a number / variable / symbol on the left side of the operator.');
		}
		
		var value = 0;
		
		if (leftToken.type === 'ComplexLiteral') {
			throw new ComputationError('Cannot take factorial of complex number.');
		} else if (leftToken.type === 'NumberLiteral') {
			value = leftToken.value;
		} else if (leftToken.type === 'NestedGroup') { // should've been evaluated, so we can get the only element's value
			value = leftToken.body[0].value;
		}
		
		var ans = factorial(value);
		ast.splice(index - 1, 2, {
			type: 'NumberLiteral',
			value: ans,
		});
		steps.push('Factorial of ' + value + ' = ' + ans);
		
		index = Parser.indexOf('!', ast);
	}
	
	// E: Exponents
	var index = Parser.indexOf('^', ast);
	while (index >= 0) {
		var current = ast[index];
		var leftToken = ast[index - 1];
		var rightToken = ast[index + 1];
		var replaceCount = 3;
		
		if (leftToken === undefined || rightToken === undefined) {
			throw new ComputationError('The `^` operator requires a number / variable / symbol on both sides of the operator.');
		}
		
		var leftValue = 0;
		var rightValue = 0;
		
		if (leftToken.type === 'ComplexLiteral') {
			leftValue = leftToken;
		} else if (leftToken.type === 'NumberLiteral') {
			leftValue = leftToken.value;
		} else if (leftToken.type === 'NestedGroup') { // should've been evaluated, so we can get the only element's value
			leftValue = leftToken.body[0].value;
		}
		
		if (rightToken.type === 'Operator' && rightToken.value === '-') { // distribute the negative in
			++replaceCount;
			
			if (ast[index + 2].type === 'ComplexLiteral') {
				rightValue = {
					type: ast[index + 2].type,
					real: -1 * ast[index + 2].real,
					imaginary: -1 * ast[index + 2].imaginary,
				};
			} else if (ast[index + 2].type === 'NumberLiteral') {
				rightValue = -1 * ast[index + 2].value;
			} else if (ast[index + 2].type === 'NestedGroup') {
				rightValue = -1 * ast[index + 2].body[0].value;
			}
		} else if (rightToken.type === 'ComplexLiteral') {
			rightValue = rightToken;
		} else if (rightToken.type === 'NumberLiteral') {
			rightValue = rightToken.value;
		} else if (rightToken.type === 'NestedGroup') { // should've been evaluated, so we can get the only element's value
			rightValue = rightToken.body[0].value;
		}
		
		var ans = pow(leftValue, rightValue);
		if (typeof ans === 'object') {
			ast.splice(index - 1, replaceCount, ans);
		} else {
			ast.splice(index - 1, replaceCount, {
				type: 'NumberLiteral',
				value: ans,
			});
		}
		steps.push('Raise ' + leftValue + ' to ' + rightValue + ' = ' + ans);
		index = Parser.indexOf('^', ast);
	}
	
	// MD: multiplication, division, and modulus
	var index = Parser.indexOf(['*', '/', '%'], ast);
	while (index >= 0) {
		var current = ast[index];
		var leftToken = ast[index - 1];
		var rightToken = ast[index + 1];
		
		if (leftToken === undefined || rightToken === undefined) {
			throw new ComputationError('The `' + current.value + '` operator requires a number / variable / symbol on both sides of the operator.');
		}
		
		var leftValue = 0;
		var rightValue = 0;
		
		if (leftToken.type === 'ComplexLiteral') {
			leftValue = leftToken;
		} else if (leftToken.type === 'NumberLiteral') {
			leftValue = leftToken.value;
		} else if (leftToken.type === 'NestedGroup') { // should've been evaluated, so we can get the only element's value
			leftValue = leftToken.body[0].value;
		}
		
		if (rightToken.type === 'Operator' && rightToken.value === '-') { // distribute the negative in
			if (ast[index + 2].type === 'ComplexLiteral') {
				rightValue = {
					type: ast[index + 2].type,
					real: -1 * ast[index + 2].real,
					imaginary: -1 * ast[index + 2].imaginary,
				};
			} else if (ast[index + 2].type === 'NumberLiteral') {
				rightValue = -1 * ast[index + 2].value;
			} else if (ast[index + 2].type === 'NestedGroup') {
				rightValue = -1 * ast[index + 2].body[0].value;
			}
		} else if (rightToken.type === 'ComplexLiteral') {
			rightValue = rightToken;
		} else if (rightToken.type === 'NumberLiteral') {
			rightValue = rightToken.value;
		} else if (rightToken.type === 'NestedGroup') { // should've been evaluated, so we can get the only element's value
			rightValue = rightToken.body[0].value;
		}
		
		var ans;
		if (current.value === '*') {
			if (typeof leftValue === 'object' || typeof rightValue === 'object') {
				if (typeof leftValue === 'object' && typeof rightValue === 'object') { // multiplying two complex numbers
					ans = {
						type: 'ComplexLiteral',
						real: -1 * leftValue.imaginary * rightValue.imaginary + leftValue.real * rightValue.real,
						imaginary: leftValue.imaginary * rightValue.real + leftValue.real * rightValue.imaginary,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				} else if (typeof leftValue === 'object') { // multiplying a complex number and a real number
					ans = {
						type: 'ComplexLiteral',
						real: leftValue.real * rightValue,
						imaginary: leftValue.imaginary * rightValue,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				} else if (typeof rightValue === 'object') { // multiplying a real number and a complex number
					ans = {
						type: 'ComplexLiteral',
						real: leftValue * rightValue.real,
						imaginary: leftValue * rightValue.imaginary,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				}
				
				if (ans.imaginary === 0) {
					ans = {
						type: 'NumberLiteral',
						value: ans.real,
					};
				}
				
				ast.splice(index - 1, 3, ans);
			} else {
				ans = leftValue * rightValue;
				ast.splice(index - 1, 3, {
					type: 'NumberLiteral',
					value: ans,
				});
				steps.push('Multiply ' + leftValue + ' by ' + rightValue + ' = ' + ans);
			}
		} else if (current.value === '/') {
			if (typeof leftValue === 'object' || typeof rightValue === 'object') {
				if (typeof leftValue === 'object' && typeof rightValue === 'object') { // dividing two complex numbers
					var denSum = pow(rightValue.real, 2) + pow(rightValue.imaginary, 2);
					ans = {
						type: 'ComplexLiteral',
						real: (leftValue.real * rightValue.real + leftValue.imaginary * rightValue.imaginary) / denSum,
						imaginary: (leftValue.imaginary * rightValue.real - leftValue.real * rightValue.imaginary) / denSum,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				} else if (typeof leftValue === 'object') { // dividing a complex number and a real number
					ans = {
						type: 'ComplexLiteral',
						real: leftValue.real / rightValue,
						imaginary: leftValue.imaginary / rightValue,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				} else if (typeof rightValue === 'object') { // dividing a real number and a complex number
					var conjugateDen = -rightValue.imaginary * rightValue.imaginary + rightValue.real * -rightValue.real;
					ans = {
						type: 'ComplexLiteral',
						real: leftValue * -rightValue.real / conjugateDen,
						imaginary: leftValue * rightValue.imaginary / conjugateDen,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				}
				
				if (ans.imaginary === 0) {
					ans = {
						type: 'NumberLiteral',
						value: ans.real,
					};
				}
				
				ast.splice(index - 1, 3, ans);
			} else {
				ans = leftValue / rightValue;
				ast.splice(index - 1, 3, {
					type: 'NumberLiteral',
					value: ans,
				});
				steps.push('Divide ' + leftValue + ' by ' + rightValue + ' = ' + ans);
			}
		} else if (current.value === '%') {
			if (typeof leftValue === 'object' || typeof rightValue === 'object') {
				throw new ComputationError('Cannot compute remainder division with complex numbers.');
			}
			
			ans = leftValue % rightValue;
			ast.splice(index - 1, 3, {
				type: 'NumberLiteral',
				value: ans,
			});
			steps.push('Compute remainder of ' + leftValue + ' divided by ' + rightValue + ' = ' + ans);
		}
		
		index = Parser.indexOf(['*', '/', '%'], ast);
	}
	
	// AS: addition, subtraction
	var index = Parser.indexOf(['+', '-'], ast);
	while (index >= 0) {
		var current = ast[index];
		var leftToken = ast[index - 1];
		var rightToken = ast[index + 1];
		var replaceCount = 3;
		
		if (current.value === '+') {
			if (leftToken === undefined || rightToken === undefined) {
				throw new ComputationError('The `+` operator requires a number / variable / symbol on both sides of the operator.');
			}
		} else {
			if ((leftToken === undefined && rightToken === undefined) || (leftToken !== undefined && rightToken === undefined)) {
				throw new ComputationError('The `-` operator requires a number / variable / symbol on both sides of the operator, or it can have one number / variable / symbol on its right.');
			}
		}
		
		var leftValue = 0;
		var rightValue = 0;
		
		if (!leftToken) {
			++index;
			--replaceCount;
			leftValue = 0;
		} else if (leftToken.type === 'ComplexLiteral') {
			leftValue = leftToken;
		} else if (leftToken.type === 'NumberLiteral') {
			leftValue = leftToken.value;
		} else if (leftToken.type === 'NestedGroup') { // should've been evaluated, so we can get the only element's value
			leftValue = leftToken.body[0].value;
		}
		
		if (rightToken.type === 'Operator' && rightToken.value === '-') { // distribute the negative in
			++replaceCount;
			
			if (ast[index + 2] === undefined || !['ComplexLiteral', 'NumberLiteral', 'NestedGroup'].includes(ast[index + 2].type)) {
				throw new ComputationError('The `-` operator requires a number / variable / symbol on its right.');
			}
			
			if (ast[index + 2].type === 'ComplexLiteral') {
				rightValue = {
					type: ast[index + 2].type,
					real: -1 * ast[index + 2].real,
					imaginary: -1 * ast[index + 2].imaginary,
				};
			} else if (ast[index + 2].type === 'NumberLiteral') {
				rightValue = -1 * ast[index + 2].value;
			} else if (ast[index + 2].type === 'NestedGroup') {
				rightValue = -1 * ast[index + 2].body[0].value;
			}
		} else if (rightToken.type === 'ComplexLiteral') {
			rightValue = rightToken;
		} else if (rightToken.type === 'NumberLiteral') {
			rightValue = rightToken.value;
		} else if (rightToken.type === 'NestedGroup') { // should've been evaluated, so we can get the only element's value
			rightValue = rightToken.body[0].value;
		}
		
		var ans;
		if (current.value === '+') {
			if (typeof leftValue === 'object' || typeof rightValue === 'object') {
				if (typeof leftValue === 'object' && typeof rightValue === 'object') { // adding two complex numbers
					ans = {
						type: 'ComplexLiteral',
						real: leftValue.real + rightValue.real,
						imaginary: leftValue.imaginary + rightValue.imaginary,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				} else if (typeof leftValue === 'object') { // adding a complex number and a real number
					ans = {
						type: 'ComplexLiteral',
						real: leftValue.real + rightValue,
						imaginary: leftValue.imaginary,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				} else if (typeof rightValue === 'object') { // adding a real number and a complex number
					ans = {
						type: 'ComplexLiteral',
						real: leftValue + rightValue.real,
						imaginary: rightValue.imaginary,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				}
				
				if (ans.imaginary === 0) {
					ans = {
						type: 'NumberLiteral',
						value: ans.real,
					};
				}
				
				ast.splice(index - 1, replaceCount, ans);
			} else {
				ans = leftValue + rightValue;
				ast.splice(index - 1, replaceCount, {
					type: 'NumberLiteral',
					value: ans,
				});
				steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
			}
		} else if (current.value === '-') {
			if (typeof leftValue === 'object' || typeof rightValue === 'object') {
				if (typeof leftValue === 'object' && typeof rightValue === 'object') { // subtracting two complex numbers
					ans = {
						type: 'ComplexLiteral',
						real: leftValue.real - rightValue.real,
						imaginary: leftValue.imaginary - rightValue.imaginary,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				} else if (typeof leftValue === 'object') { // subtracting a complex number and a real number
					ans = {
						type: 'ComplexLiteral',
						real: leftValue.real - rightValue,
						imaginary: leftValue.imaginary,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				} else if (typeof rightValue === 'object') { // subtracting a real number and a complex number
					ans = {
						type: 'ComplexLiteral',
						real: leftValue - rightValue.real,
						imaginary: -rightValue.imaginary,
					};
					//steps.push('Add ' + leftValue + ' and ' + rightValue + ' = ' + ans);
				}
				
				if (ans.imaginary === 0) {
					ans = {
						type: 'NumberLiteral',
						value: ans.real,
					};
				}
				
				ast.splice(index - 1, replaceCount, ans);
			} else {
				ans = leftValue - rightValue;
				ast.splice(index - 1, replaceCount, {
					type: 'NumberLiteral',
					value: ans,
				});
				steps.push('Subtract ' + leftValue + ' and ' + rightValue + ' = ' + ans);
			}
		}
		
		index = Parser.indexOf(['+', '-'], ast);
	}
	
	return {
		ast: ast,
		steps: steps,
	};
};

// combines all the evaluation functions into one
// evaluates a string expression with the given calculation variables and trigonometry mode
var e = function(exp, calcVars, trigMode) {
	m = trigMode;
	
	calcVars = Object.assign({
		tau: 6.283185307179586,
		pi: 3.141592653589793,
		e: 2.718281828459045,
		phi: 1.618033988749895,
		i: {type: 'ComplexLiteral', real: 0, imaginary: 1},
	}, calcVars);
	
	var parsedAs = undefined;
	var ast = exp;
	
	if (typeof exp === 'string') {
		parsedAs = p.parse(exp, ['whitespace']);
		ast = deepCopy(parsedAs);
	} else {
		ast = deepCopy(exp);
	}
	
	// replace variable names with their values
	ast = correctValues(ast, calcVars);
	
	// evaluate
	var result = baseEvaluate(ast, calcVars, trigMode, 'expression');
	
	// should be size 1
	if (result.ast.length > 1) {
		throw new SyntaxError('There were too many nodes in the resulting tree.');
		//throw new ComputationError('Resulting tree should\'ve been one node, but it was ' + ast.length + ' nodes long.');
	}
	
	if (result.ast[0].type === 'NumberLiteral') {
		if (!isFinite(result.ast[0].value)) {
			throw new ComputationError('The answer does not exist, or was too large to display.');
		}
		
		result.value = result.ast[0].value;
	} else if (result.ast[0].type === 'ComplexLiteral') {
		result.value = result.ast[0];
	}
	
	return {
		input: exp,
		parsedAs: parsedAs,
		result: result.value,
		steps: result.steps,
	};
};

var join = function(ast) {
	var str = '';
	
	for (var i = 0; i < ast.length; ++i) {
		if (ast[i].type === 'NestedGroup') {
			str += '(' + join(ast[i].body) + ')';
		} else {
			str += ast[i].value;
		}
	}
	
	return str;
};

module.exports = {
	ComputationError: ComputationError,
	TokenizationError: TokenizationError,
	
	functions: {
		sin: sin,
		cos: cos,
		tan: tan,
		csc: csc,
		sec: sec,
		cot: cot,
		asin: asin,
		acos: acos,
		atan: atan,
		asec: asec,
		acsc: acsc,
		acot: acot,
		dtr: dtr,
		rtd: rtd,
		log: log,
		ln: ln,
		sqrt: sqrt,
		cbrt: cbrt,
		root: root,
		scientific: scientific,
		pow: pow,
		factorial: factorial,
		abs: abs,
		ceil: ceil,
		floor: floor,
		round: round,
		clamp: clamp,
		polarity: polarity,
	},
	
	parse: function(exp) {
		var result = p.parse(exp, ['whitespace']);
		result.toString = () => join(result);
		return result;
	},
	
	evaluate: function(exp, calcVars, trigMode) {
		var ans = e(exp, calcVars, trigMode);
		return ans.result;
		//return mJS.fraction(ans.result[0].value).valueOf();
	},
	
	evaluateInfo: function(exp, calcVars, trigMode) {
		var ans = e(exp, calcVars, trigMode);
		//ans.result = mJS.fraction(ans.result[0].value).valueOf();
		return ans;
	},
	
	angleMode: function(trigMode) {
		m = trigMode;
	},
	
	// returns the angle of (value * 360 | 2PI)
	ofCircle: function(value) {
		if (m === 'degree') {
			return value * 360;
		} else if (m === 'radian') {
			return value * 2 * Math.PI;
		}
	},
	
	normalToSuper: normalToSuper,
	superToNormal: superToNormal,
	
	reverseSuperscripts: reverseSuperscripts,
	superScripts: superScripts,
};