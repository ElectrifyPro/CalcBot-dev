var {functions, evaluate} = require('./calculate');
var {TokenizationError, ComputationError, Parser, Tokenizer} = require('./compiler.js');

// returns an array of indexes of elements that pass the provided callback function
Array.prototype.findIndexes = function(callback) {
	var indexes = [];
	
	for (var i = 0; i < this.length; ++i) {
		if (callback(this[i], i, this)) {
			indexes.push(i);
		}
	}
	
	return indexes;
};

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

var parseInequality = function(tokens, current, parser) {
	var tokensParsed = [tokens[current]];
	
	if (tokens[current].type === 'great' || tokens[current].type === 'less') {
		if (tokens[current + 1].type === 'equal') {
			tokensParsed.push(tokens[current + 1]);
		}
		
		return {
			comparison: tokens[current].type,
			inclusive: tokensParsed.length === 2,
			offset: 0,
			tokensParsed: 1,
			type: 'Inequality',
			value: tokensParsed.reduce((accumulator, currentValue) => accumulator + currentValue.value, ''),
		};
	}
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
		if (tokens[current].value === '∞') {
			return {
				offset: 0,
				tokensParsed: 1,
				type: 'NumberLiteral',
				value: Infinity,
			};
		} else if (tokens[current].value === '×' || tokens[current].value === '·') {
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

var implicitRules = {
	close_paren: ['number', 'name', 'open_paren'],
	number: ['name', 'open_paren'],
	name: ['number', 'open_paren'],
};

var t = new Tokenizer([{regex: /\s+/, type: 'whitespace'}, {regex: /[a-z]+/i, type: 'name'}, {regex: />/, type: 'great'}, {regex: /</, type: 'less'}, {regex: /=/, type: 'equal'}, {regex: /⁺/, type: 'super_add'}, {regex: /\+/, type: 'add'}, {regex: /⁻/, type: 'super_subtract'}, {regex: /-/, type: 'subtract'}, {regex: /\*/, type: 'multiply'}, {regex: /\//, type: 'divide'}, {regex: /%/, type: 'modulo'}, {regex: /\^/, type: 'exponent'}, {regex: /!/, type: 'factorial'}, {regex: /,/, type: 'comma'}, {regex: /\(/, type: 'open_paren'}, {regex: /\)/, type: 'close_paren'}, {regex: /[⁰¹²³⁴⁵⁶⁷⁸⁹]+/, type: 'super_number'}, {regex: /\d+/, type: 'number'}, {regex: /\./, type: 'dot'}, {regex: /./, type: 'symbol'}], function(tokens) {
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
	
	if (open !== close) {
		throw new SyntaxError('Parenthesis were not opened / closed properly.');
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

var p = new Parser(t, [parseNumber, parseName, parseInequality, parseNested, parseFunctionCall, parseOperator, parseSuper, parseSymbol]);

var e = function(exp, calcVars, trigMode) {
	var parsedAs = undefined;
	var ast = exp;
	
	if (typeof exp === 'string') {
		parsedAs = p.parse(exp, ['whitespace']);
		ast = deepCopy(parsedAs);
	} else {
		ast = deepCopy(exp);
	}
	
	// get the indexes of the inequalities
	var ineqs = ast.findIndexes((e) => e.type === 'Inequality');
	
	if (ineqs.length === 0) {
		throw new ComputationError('This inequality doesn\'t contain a comparison operator (`>=`, `>`, `<=`, `<`).');
	}
	
	// get location of x variable and check for inequalities on both or one side
	var x = ast.findIndex((e, index, arr) => (arr[index - 1] === undefined || arr[index - 1].type === 'Inequality') && (arr[index +	1] === undefined || arr[index + 1].type === 'Inequality') && e.type === 'VariableName' && e.value === 'x');
	
	if (x === -1) {
		throw new ComputationError('The `x` variable should be surrounded by two or one comparison operator (`>=`, `>`, `<=`, `<`).');
	}
	
	var relation = {};
	
	// if there's only one inequality, parse it differently than when there's two
	if (ineqs.length === 1) {
		var exp = [];
		
		// see if the relation is on the left side of the variable; if so, reverse the comparison (varable is always x)
		if (ineqs[0] < x) {
			if (ast[ineqs[0]].comparison === 'great') {
				ast[ineqs[0]].comparison = 'less';
			} else {
				ast[ineqs[0]].comparison = 'great';
			}
			
			exp = evaluate(ast.slice(0, ineqs[0]));
		} else {
			exp = evaluate(ast.slice(ineqs[0] + 1, ast.length));
		}
		
		relation[ast[ineqs[0]].comparison] = {
			than: exp,
			inclusive: ast[ineqs[0]].inclusive,
		};
		
		relation.variable = 'x';
	} else {
		// split the ast by the inequalities and evaluate each side
		// there can only be **two** inequality symbols as a result, and the side in the middle shoud just be a variable
		var sides = {};
		sides.variable = ast.slice(ineqs[0] + 1, ineqs[1])[0].value;
		sides.exps = [evaluate(ast.slice(0, ineqs[0]), calcVars, trigMode), evaluate(ast.slice(ineqs[1] + 1, ast.length), calcVars, trigMode)];
		
		// determine the relation the variable has with the two sides of the inequality
		// the relation can overlap with itself
		for (var i = 0; i < ineqs.length; ++i) {
			var op = ast[ineqs[i]];
			
			// reverse relations if it is to the left of the variable
			if (i === 0) {
				if (op.comparison === 'great') {
					op.comparison = 'less';
				} else {
					op.comparison = 'great';
				}
			}
			
			if (!relation[op.comparison]) {
				relation[op.comparison] = {
					than: sides.exps[i],
					inclusive: op.inclusive,
				};
			} else { // combine relations
				if (sides.exps[i] === relation[op.comparison]) { // if this side of the inequality is equal to the other, change their inclusivity
					relation[op.comparison].inclusive = op.inclusive || relation[op.comparison].inclusive;
				} else if ((op.comparison === 'less' && sides.exps[i] > relation[op.comparison].than) || (op.comparison === 'great' && sides.exps[i] < relation[op.comparison].than)) { // if this side of the inequality is greater than the other, combine the two
					relation[op.comparison] = {
						than: sides.exps[i],
						inclusive: op.inclusive,
					};
				}
			} // if none of these conditions are satisfied, discard this side
		}
		
		relation.variable = sides.variable;
	}
	
	return relation;
};

module.exports = {
	parse: e,
	
	// returns the inequality from an array of inequalities the value passed is in between
	betweenInequality: function(v, arr) {
		for (var i = 0; i < arr.length; ++i) {
			var ineq = arr[i];
			
			var desc = {
				left: ineq.condition.great !== undefined ? ineq.condition.great.than : -Infinity,
				right: ineq.condition.less !== undefined ? ineq.condition.less.than : Infinity,
				leftInclusive: ineq.condition.great !== undefined && ineq.condition.great.inclusive === true,
				rightInclusive: ineq.condition.less !== undefined && ineq.condition.less.inclusive === true,
			};
			
			if ((!desc.leftInclusive ? v > desc.left : v >= desc.left) && (!desc.rightInclusive ? v < desc.right : v <= desc.right)) {
				return ineq;
			}
		}
		
		return undefined;
	},
	
	// returns true if two inequalities overlap
	inequalityOverlap: function(a, b) {
		// determine bounds of inequalities
		var aDesc = {
			left: a.great !== undefined ? a.great.than : -Infinity,
			right: a.less !== undefined ? a.less.than : Infinity,
			leftInclusive: a.great !== undefined && a.great.inclusive === true,
			rightInclusive: a.less !== undefined && a.less.inclusive === true,
		};
		
		var bDesc = {
			left: b.great !== undefined ? b.great.than : -Infinity,
			right: b.less !== undefined ? b.less.than : Infinity,
			leftInclusive: b.great !== undefined && b.great.inclusive === true,
			rightInclusive: b.less !== undefined && b.less.inclusive === true,
		};
		
		// check for intersection
		return (!aDesc.leftInclusive || !bDesc.rightInclusive ? aDesc.left < bDesc.right : aDesc.left <= bDesc.right) && (!aDesc.rightInclusive || !bDesc.leftInclusive ? aDesc.right > bDesc.left : aDesc.right >= bDesc.left);
	},
};