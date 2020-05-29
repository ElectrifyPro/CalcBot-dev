// math.js is the bot's math module

var Canvas = require('canvas');
var mJS = require('mathjs');
var alG = require('algebrite');
var regression = require('regression');
var nerdamer = require('nerdamer/all');
var {ComputationError, TokenizationError, functions:f, parse, evaluate, evaluateInfo, angleMode, ofCircle, normalToSuper, superToNormal, superScripts:ss} = require('./parsers/calculate.js');

var generateStepString = function(steps, tabLevel = 1) {
	var str = '--- In ' + steps.current + ' ---\n';
	
	for (var i = 0; i < steps.length; ++i) {
		if (i === 0) {
			str += '\t'.repeat(tabLevel) + '--- In ' + steps[i].current + ' ---';
		}
		
		if (typeof steps[i] === 'object') {
			if (steps[i].length === 0) {
				str += '\n' + '\t'.repeat(tabLevel + 1) + '_no steps_';
			} else {
				str += '\n' + '\t'.repeat(tabLevel) + generateStepString(steps[i], tabLevel + 1);
			}
		} else {
			str += '\n' + '\t'.repeat(tabLevel) + steps[i];
		}
	}
	
	return str;
};

//mJS.simplify.rules = mJS.simplify.rules.concat(['0 * n -> 0', '1 * n -> n', 'n^1 -> n', 'n1 * c / n2 / n3 -> (n1 * c) / (n2 * n3)', 'n1 * n2 / n2 -> n1', 'n1 / n2 / n3 -> n1 / (n2 * n3)']);

/**
utilites
**/
// returns the prefix of a number, e.g. 1 = st, 2 = nd
var numSuffix = function(num) {
	var string = num.toString();
	var lastChar = string.charAt(string.length - 1);
	var nextLastChar = string.charAt(string.length - 2);
	
	if (lastChar === '1') {
		if (string.length === 1) {
			return 'st';
		} else {
			if (nextLastChar === '1') {
				return 'th';
			} else {
				return 'st';
			}
		}
	} else if (lastChar === '2') {
		return 'nd';
	} else if (lastChar === '3') {
		return 'rd';
	} else {
		return 'th';
	}
};

// converts a hex to rgb
var hexToRgb = function(hex) {
	var parsed = parseInt(hex, 16);
	var r = (parsed >> 16) & 255;
	var g = (parsed >> 8) & 255;
	var b = parsed & 255;
	
	return [r, g, b];
};

// random rgb value
var randomRgb = function() {
	var num = Math.round(0xffffff * Math.random());
	var r = num >> 16;
	var g = num >> 8 & 255;
	var b = num & 255;
	
	return [r, g, b];
};

// replace a section of a string with a new one
String.prototype.boundReplace = function(str, start, end) {
	return this.substring(0, start) + str + this.substring(start + str.length, end);
};

// takes a string, an index to start at in the string, and heads out in both directions of the string to find the indexes of parsed expressions
// this is good for power detection (like in .calculate) or finding when a function ends
// continueLeft, continueRigiht = if these regexes do not match the next character, it will stop
var findExpressionLimitsHere = function(str, begin, continueLeft, continueRight, characters = '') {
	var charactersToTrack = characters.split('');
	var index = begin;
	
	var leftIndex = index;
	var rightIndex = index;
	var trackInfo = {
		characters: []
	};
	
	var parenIndex = 0; // must be 0 in order to break from 'paren' mode
	while (leftIndex >= 0) {
		--leftIndex;
		var current = str.charAt(leftIndex);
		
		var potentitalObj = {
			character: current,
			index: leftIndex,
			heading: -1,
		};
		
		if (current === ')') {
			++parenIndex;
		} else if (current === '(' && parenIndex !== 0) {
			--parenIndex;
		} else if (parenIndex === 0 && !continueLeft.test(current)) {
			++leftIndex;
			parenIndex = 0;
			break;
		}
		
		potentitalObj.parenIndex = parenIndex;
		
		if (charactersToTrack.includes(current)) {
			trackInfo.characters.push(potentitalObj);
		}
	}
	
	if (rightIndex === index && str.charAt(index + 1) === '-') {
		++rightIndex;
	}

	while (rightIndex <= str.length) {
		++rightIndex;
		var current = str.charAt(rightIndex);
		
		var potentitalObj = {
			character: current,
			index: rightIndex,
			heading: 1,
		};
		
		if (current === '(') {
			++parenIndex;
		} else if (current === ')' && parenIndex !== 0) {
			--parenIndex;
		} else if (parenIndex === 0 && !continueRight.test(current)) {
			--rightIndex;
			parenIndex = 0;
			break;
		}
		
		potentitalObj.parenIndex = parenIndex;
		
		if (charactersToTrack.includes(current)) {
			trackInfo.characters.push(potentitalObj);
		}
	}
	
	var result = [leftIndex, rightIndex];
	result.trackInfo = trackInfo;
	
	return result;
};

// convert a string using the same conversion algorithm as math.calc.ceval
var convertCeval = function(exp, mode, calcVars, customFunctions) {
	exp = exp.split(' ').join('').toLowerCase();
	
	exp = parse(exp).toString();
	
	return exp;
};

// convert a string to one accepted by mathjs
var convertToMJSUsable = function(str) {
	var result = str;
	
	// temporarily replace to all caps to test for logs
	result = result.replace(/\blog\(/g, 'LOG(');
	while (/\bLOG\(/g.test(result)) {
		var index = result.indexOf('LOG') + 2;
		var limits = findExpressionLimitsHere(result, index, /[A-Za-z\d\.]/, /[A-Za-z\d\.]/, ',');
		
		// check the object of the limits result; if there is a comma detected with parenIndex 1, that means that the user provided a base for log(), and this replacement should not take place
		var noLogComma = limits.trackInfo.characters.every(function(obj) {
			return obj.parenIndex !== 1;
		});
		
		// there was no base provided, so add the base ,10) to the end of log(
		if (noLogComma) {
			result = result.substring(0, index - 2) + 'log' + result.substring(index + 1, limits[1]) + ',10)' + result.substring(limits[1] + 1, result.length);
		} else { // there is a base, do nothing
			result = result.substring(0, index - 2) + 'log' + result.substring(index + 1, result.length);
		}
	}
	
	result = result.replace(/\bln\(/g, 'log(');
	
	return result;
};

// convert a string given by mathjs to a normal one
var convertToUsable = function(str) {
	var result = str.split(' ').join('');
	
	result = result.replace(/\blog\(/g, 'ln(');
	
	// temporarily replace to all caps to test for logs
	result = result.replace(/\bln\(/g, 'LN(');
	while (/\bLN\(/g.test(result)) {
		var index = result.indexOf('LN') + 1;
		var limits = findExpressionLimitsHere(result, index, /[A-Za-z\d\.]/, /[A-Za-z\d\.]/, ',');
		
		// check the object of the limits result; if there is a comma detected with parenIndex 1, that means that mathJS wrote log(x, with a base)
		var noLogComma = limits.trackInfo.characters.every(function(obj) {
			return obj.parenIndex !== 1;
		});
		
		// there was no base provided, so leave as is
		if (noLogComma) {
			result = result.substring(0, index - 1) + 'ln' + result.substring(index + 1, result.length);
		} else { // there is a base
			// check the value of the base by finding the index of the comma at parenIndex 1
			var baseIndex = limits.trackInfo.characters.find((obj) => obj.character === ',' && obj.parenIndex === 1).index + 1;
			var base = result.substring(baseIndex, limits[1]);
			
			// if the base is 10, remove it (limits[1] - 3)
			if (base === '10') {
				result = result.substring(0, index - 1) + 'log' + result.substring(index + 1, limits[1] - 3) + ')' + result.substring(limits[1] + 1, result.length);
			} else { // otherwise, do nothing
				result = result.substring(0, index - 1) + 'log' + result.substring(index + 1, result.length);
			}
		}
	}
	
	return result;
};

var isInt = (num) => f.round(num) === Number(num);

// 2D vector declaration
class Vector {
	static vc = require('./parsers/vector.js');
	
	// unit vector definitions
	static i = new Vector('i', 1, 0);
	static j = new Vector('j', 0, 1);
	
	constructor(name, x1, y1, x2, y2) {
		this.name = name;
		
		if (x2 === undefined || y2 === undefined || x2 === null || y2 === null) { // if only two coordinates are provided; i know it looks confusing but just think about it lol
			this.x1 = 0;
			this.y1 = 0;
			this.x2 = Number(x1);
			this.y2 = Number(y1);
		} else {
			this.x1 = Number(x1);
			this.y1 = Number(y1);
			this.x2 = Number(x2);
			this.y2 = Number(y2);
		}
	}
	
	// convert an array to a vector
	static fromArr(arr) {
		return new Vector(arr[0], arr[1], arr[2], arr[3], arr[4]);
	}
	
	// returns a vector with a given magnitude and angle (polar form)
	static fromPolar(name, mag, angle) {
		return new Vector(name, mag * f.cos(angle), mag * f.sin(angle));
	}
	
	// returns the quadrant the vector component's head lies in (5 = x axis, 6 = y axis)
	quadrant() {
		var c = this.component();
		
		if (c.x2 > 0) {
			if (c.y2 > 0) {
				return 1;
			} else if (c.y2 < 0) {
				return 4;
			}
		} else if (c.x2 < 0) {
			if (c.y2 > 0) {
				return 2;
			} else if (c.y2 < 0) {
				return 3;
			}
		}
		
		if (c.x2 === 0) {
			return 6;
		} else if (c.y2 === 0) {
			return 5;
		}
	}
	
	// returns a vector's direction angle based on unit vector i
	dirAngle(mode) {
		angleMode(mode);
		
		var q = this.quadrant();
		var c = this.component();
		var direction = f.atan(c.y2 / c.x2);
		
		// add to direction based on the quadrant the vector's head lies in
		if (c.x2 < 0) {
			direction += ofCircle(0.5);
		} else if (c.x2 >= 0 && c.y2 < 0) {
			direction += ofCircle(1);
		}
		
		return direction;
	}
	
	// returns a vector's component form
	component() {
		return new Vector(this.name, this.x2 - this.x1, this.y2 - this.y1);
	}
	
	// returns a vector's magnitude
	magnitude() {
		return f.sqrt(f.pow(this.x2 - this.x1, 2) + f.pow(this.y2 - this.y1, 2));
	}
	
	// returns the vector's unit
	unit() {
		var c = this.component();
		var m = c.magnitude();
		
		return new Vector(c.name, c.x2 / m, c.y2 / m);
	}
	
	// returns dot product of two vectors
	static dot(v1, v2) {
		var vc1 = v1.component();
		var vc2 = v2.component();
		
		return vc1.x2 * vc2.x2 + vc1.y2 * vc2.y2;
	}
	
	// adds two vectors
	static add(v1, v2) {
		var vc1 = v1.component();
		var vc2 = v2.component();
		
		return new Vector('', vc1.x2 + vc2.x2, vc1.y2 + vc2.y2);
	}
	
	// subtracts two vectors
	static subtract(v1, v2) {
		var vc1 = v1.component();
		var vc2 = v2.component();
		
		return new Vector('', vc1.x2 - vc2.x2, vc1.y2 - vc2.y2);
	}
	
	// returns vector multiplied by a scalar
	static multiply(v, s) {
		return new Vector(v.name, v.x1 * s, v.y1 * s, v.x2 * s, v.y2 * s)
	}
	
	// evaluates a vector expression, accepting an array of defined vectors that this method can refer to
	static evaluate(exp, definedVectors) {
		var ast = Vector.vc.evaluate(exp, definedVectors);
		
		// convert the result to a string
		var str = '';
		
		ast.forEach(function(token) {
			if (token.type === 'VectorLiteral') {
				str += '(' + token.value[0] + ', ' + token.value[1] + ')';
			} else {
				str += token.value;
			}
		});
		
		return str;
	}
	
	// takes an array of arguments representing vectors and an array of defined vectors and checks if the vectors inside the first array are defined under the second array
	static definedArray(arr, defines) {
		var allDefined = true;
		
		var defined = [];
		
		arr.forEach(function(arg, index) {
			defined[index] = false;
			
			defines.forEach(function(v) {
				if (arg === v.name) {
					defined[index] = true;
				}
			});
		});
		
		defined.forEach(function(bool) {
			if (!bool) {
				allDefined = false;
			}
		});
		
		return allDefined;
	}
	
	// takes an array of stored coordinates and converts them to vectors
	// [name, x1, y1, x2, y2]
	static convertArrays(arr) {
		var vectors = [];
		
		arr.forEach(function(list, index) {
			vectors[index] = new Vector(list[0], list[1], list[2], list[3], list[4]);
		});
		
		return vectors;
	}
	
	// converts a vector to an array
	static toArray(v) {
		return [v.name, v.x1, v.y1, v.x2, v.y2];
	}
	
	// returns a nicely formatted string representing the vector
	toString() {
		return '(' + this.x1 + ', ' + this.y1 + ', ' + this.x2 + ', ' + this.y2 + ')';
	}
}

// thrown when the user tries to add a nonexistent formula
class NoFormulaError extends Error {
	constructor(message) {
		super(message);
		this.name = 'NoFormulaError';
	}
}

// Formula declaration
class Formula {
	constructor(id, ...args) {
		this.step = 0;
		this.id = id;
		this.args = args;
		
		if (id === 'igl') {
			this.name = 'Ideal Gas Law';
			this.leaveBlank = 1;
			
			this.definition = 'P * V = n * R * T';
			this.exclude = [{name: 'R', description: 'ideal gas constant (0.08206)'}];
			this.vars = [{name: 'P', description: 'pressure (atm)'}, {name: 'V', description: 'volume (L)'}, {name: 'n', description: 'mole count'}, {name: 'T', description: 'temperature (K)'}];
		} else if (id === 'hf') {
			this.name = 'Heron\'s Formula';
			this.leaveBlank = 0;
			
			this.definition = 'p = (a + b + c) / 2\nA = sqrt(p * (p - a) * (p - b) * (p - c))';
			this.exclude = [{name: 'p', description: 'half of perimeter'}, {name: 'A', description: 'area of triangle'}];
			this.vars = [{name: 'a', description: 'side a'}, {name: 'b', description: 'side b'}, {name: 'c', description: 'side c'}];
		} else if (id === 'pyt') {
			this.name = 'Pythagorean Theorem';
			this.leaveBlank = 1;
			
			this.definition = 'a^2 + b^2 = c^2';
			this.exclude = [];
			this.vars = [{name: 'a', description: 'side a (leg)'}, {name: 'b', description: 'side b (leg)'}, {name: 'c', description: 'side c (hypotenuse)'}];
		} else if (id === 'rps') {
			this.name = 'Regular Polygon Area (from side)';
			this.leaveBlank = 1;
			
			this.definition = 'A = (s^2 * n) / (4 * tan([180 | π] / n))';
			this.exclude = [];
			this.vars = [{name: 'A', description: 'area of polygon'}, {name: 's', description: 'side length'}, {name: 'n', description: 'amount of sides'}];
		} else if (id === 'rpr') {
			this.name = 'Regular Polygon Area (from radius)';
			this.leaveBlank = 1;
			
			this.definition = 'A = r^2 * n * sin([360 | 2π] / n) / 2';
			this.exclude = [];
			this.vars = [{name: 'A', description: 'area of polygon'}, {name: 'r', description: 'radius (length from center to vertex)'}, {name: 'n', description: 'amount of sides'}];
		} else if (id === 'rpa') {
			this.name = 'Regular Polygon Area (from apothem)';
			this.leaveBlank = 1;
			
			this.definition = 'A = a^2 * n * tan([180 | π] / n)';
			this.exclude = [];
			this.vars = [{name: 'A', description: 'area of polygon'}, {name: 'a', description: 'apothem (length from center to midpoint of side)'}, {name: 'n', description: 'amount of sides'}];
		} else if (id === 'sf') {
			this.name = 'Slope Formula';
			this.leaveBlank = 0;
			
			this.definition = 's = (y_2 - y_1) / (x_2 - x_1)';
			this.exclude = [{name: 's', description: 'slope'}];
			this.vars = [{name: 'x_1', description: 'point 1 x'}, {name: 'y_1', description: 'point 1 y'}, {name: 'x_2', description: 'point 2 x'}, {name: 'y_2', description: 'point 2 y'}];
		} else if (id === 'tlos') {
			this.name = 'Law of Sines';
			this.leaveBlank = 1;
			
			this.definition = 'sin(A) / a = sin(B) / b';
			this.exclude = [];
			this.vars = [{name: 'A', description: 'angle A (opposite of side a)'}, {name: 'a', description: 'side a (opposite of angle A)'}, {name: 'B', description: 'angle B (opposite of side b)'}, {name: 'b', description: 'side b (opposite of angle B)'}];
		} else if (id === 'tloc') {
			this.name = 'Law of Cosines';
			this.leaveBlank = 1;
			
			this.definition = 'a^2 = b^2 + c^2 - 2 * b * c * cos(A)';
			this.exclude = [];
			this.vars = [{name: 'a', description: 'side a (opposite of angle A)'}, {name: 'b', description: 'side b'}, {name: 'c', description: 'side c'}, {name: 'A', description: 'angle A (opposite of side a)'}];
		} else if (id === 'tts') {
			this.name = 'Triangle Area';
			this.leaveBlank = 1;
			
			this.definition = 'A = (1 / 2) * s_1 * s_2 * sin(a_3)';
			this.exclude = [];
			this.vars = [{name: 'A', description: 'area'}, {name: 's_1', description: 'side 1'}, {name: 's_2', description: 'side 2'}, {name: 'a_3', description: 'angle 3 (angle opposite of side 3)'}];
		} else {
			throw new NoFormulaError(id + ' is an invalid formula ID.');
		}
	}
	
	calculate() {
		if (this.id === 'igl') { // ideal gas law
			if (this.args[0] === undefined) { // finding P (pressure)
				return this.args[2] * 0.08206 * this.args[3] / this.args[1];
			} else if (this.args[1] === undefined) { // finding V (volume)
				return this.args[2] * 0.08206 * this.args[3] / this.args[0];
			} else if (this.args[2] === undefined) { // findind n (mole count)
				return (this.args[0] * this.args[1]) / (0.08206 * this.args[3]);
			} else if (this.args[3] === undefined) { // finding T (temperature)
				return (this.args[0] * this.args[1]) / (this.args[2] * 0.08206);
			}
		} else if (this.id === 'hf') { // heron's formula
			var p = (this.args[0] + this.args[1] + this.args[2]) / 2; // half of perimeter
			return f.sqrt(p * (p - this.args[0]) * (p - this.args[1]) * (p - this.args[2])); // area
		} else if (this.id === 'pyt') { // pythagorean theorem
			if (this.args[0] === undefined) { // finding a
				return f.sqrt(f.pow(this.args[2], 2) - f.pow(this.args[1], 2));
			} else if (this.args[1] === undefined) { // finding b
				return f.sqrt(f.pow(this.args[3], 2) - f.pow(this.args[0], 2));
			} else if (this.args[2] === undefined) { // finding c (hypotenuse)
				return f.sqrt(f.pow(this.args[0], 2) + f.pow(this.args[1], 2));
			}
		} else if (this.id === 'rps') { // regular polygon (from side)
			if (this.args[0] === undefined) { // finding A (area)
				return (f.pow(this.args[1], 2) * this.args[2]) / (4 * f.tan(ofCircle(0.5) / this.args[2]));
			} else if (this.args[1] === undefined) { // finding s (side length)
				return f.sqrt((this.args[0] * 4 * f.tan(ofCircle(0.5) / this.args[2])) / this.args[2]);
			}
			
			// impossible to find c
		} else if (this.id === 'rpr') { // regular polygon (from radius)
			if (this.args[0] === undefined) { // finding A (area)
				return f.pow(this.args[1], 2) * this.args[2] * f.sin(ofCircle(1) / this.args[2]) / 2;
			} else if (this.args[1] === undefined) { // finding r (radius)
				return f.sqrt((this.args[0] * 2) / (this.args[2] * f.sin(ofCircle(1) / this.args[2])));
			}
			
			// impossible to find n
		} else if (this.id === 'rpa') { // regular polygon (from apothem)
			if (this.args[0] === undefined) { // finding A (area)
				return f.pow(this.args[1], 2) * this.args[2] * f.tan(ofCircle(0.5) / this.args[2]);
			} else if (this.args[1] === undefined) { // finding a (apothem)
				return f.sqrt(this.args[0] / (this.args[2] * f.tan(ofCircle(0.5) / this.args[2])));
			}
			
			// impossible to find n
		} else if (this.id === 'sf') { // slope formula
			return (this.args[3] - this.args[1]) / (this.args[2] - this.args[0]);
		} else if (this.id === 'tlos') { // law of sines
			if (this.args[1] === undefined) { // finding a side
				return this.args[3] * f.sin(this.args[0]) / f.sin(this.args[2]);
			} else if (this.args[3] === undefined) {
				return this.args[1] * f.sin(this.args[2]) / f.sin(this.args[0]);
			} else if (this.args[0] === undefined) { // finding an angle
				return f.asin(this.args[1] * f.sin(this.args[2]) / this.args[3]);
			} else if (this.args[2] === undefined) {
				return f.asin(this.args[3] * f.sin(this.args[0]) / this.args[1]);
			}
		} else if (this.id === 'tloc') { // law of cosines
			if (this.args[0] === undefined) { // finding a side
				return f.sqrt(f.pow(this.args[1], 2) + f.pow(this.args[2], 2) - 2 * this.args[1] * this.args[2] * f.cos(this.args[3]));
			} else if (this.args[1] === undefined) {
				return f.sqrt(f.pow(this.args[0], 2) - f.pow(this.args[2], 2) + 2 * this.args[1] * this.args[2] * f.cos(this.args[3]));
			} else if (this.args[2] === undefined) {
				return f.sqrt(f.pow(this.args[0], 2) - f.pow(this.args[1], 2) + 2 * this.args[1] * this.args[2] * f.cos(this.args[3]));
			} else if (this.args[3] === undefined) { // getting the angle
				return f.acos((f.pow(this.args[0], 2) - f.pow(this.args[1], 2) - f.pow(this.args[2], 2))/(-2 * this.args[1] * this.args[2]));
			}
		} else if (this.id === 'tts') { // triangle area
			if (this.args[0] === undefined) { // finding area
				return 0.5 * this.args[1] * this.args[2] * f.sin(this.args[3]);
			} else if (this.args[1] === undefined) { // finding side 1
				return (2 * this.args[0] * f.csc(this.args[3])) / this.args[2];
			} else if (this.args[2] === undefined) { // finding side 2
				return (2 * this.args[0] * f.csc(this.args[3])) / this.args[1];
			} else if (this.args[3] === undefined) { // finding angle 3
				return f.asin((2 * this.args[0]) / (this.args[1] * this.args[2]));
			}
		}
	}
	
	// returns the amount of arguments that were left undefined by the user (usually one)
	undefinedCount() {
		var undefinedCount = 0;
		
		this.args.forEach(function(arg) {
			if (arg === undefined) {
				++undefinedCount;
			}
		});
		
		return undefinedCount;
	}
	
	// returns a string of the variables
	printVars() {
		var str = '';
		
		this.exclude.concat(this.vars).forEach(function(obj, index, arr) {
			str += obj.name + ': ' + obj.description + (index < arr.length - 1 ? '\n' : '');
		});
		
		return str;
	}
}

// implementation of a queue for searching the unit conversion / dimensional analysis conversion tree
class Queue {
	constructor() {
		this.items = [];
	}
	
	// add an item to the queue
	enqueue(item) {
		this.items.push(item);
	}
	
	// remove the head of the queue and return it
	dequeue() {
		return this.items.shift();
	}
	
	// returns the front of the queue
	peek() {
		return this.items[0];
	}
	
	// returns true if the queue is empty
	empty() {
		return this.items.length === 0;
	}
}

// thrown when a path can't be found
class NoPathError extends Error {
	constructor(message) {
		super(message);
		this.name = 'NoPathError';
	}
}

// thrown when a unit is used that doesn't exist
class NoUnitError extends Error {
	constructor(message) {
		super(message);
		this.name = 'NoUnitError';
	}
}

// unit conversion through formulas (this class is for units that can't be converted using dimensional analysis, for example, temperature, or angles)
class UC {
	static conversions = {
		// angles
		'deg': ['dtr(x) rad', '10x/9 grad'],
		'rad': ['rtd(x) deg'],
		'grad': ['0.9x deg'],
		
		// temperature
		'C': ['9x/5+32 F', 'x+273.15 K', '(9/5)(x+273.15) R', '(3/2)(100-x) De', '33x/100 N', '4x/5 Re', '21x/40+7.5 Ro'],
		'F': ['(5/9)(x-32) C'],
		'K': ['x-273.15 C'],
		'R': ['(5/9)(x-491.67) C'],
		'De': ['100-2x/3 C'],
		'N': ['100x/33 C'],
		'Re': ['5x/4 C'],
		'Ro': ['(40/21)(x-7.5) C'],
	};
	
	// convert a single unit to another
	static convert(quantity, start, end) {
		if (!(start in UC.conversions) || !(end in UC.conversions)) {
			throw new NoUnitError('The used ratios do not exist.');
		}
		
		// search for paths from the starting unit to the ending unit
		var cameFrom = {};
		var frontier = new Queue();
		
		cameFrom[start] = undefined;
		frontier.enqueue(start);
		
		while (!frontier.empty()) {
			var currentUnit = frontier.dequeue();
			
			if (currentUnit === end) {
				break;
			}
			
			if (UC.conversions[currentUnit]) {
				UC.conversions[currentUnit].forEach(function(ratio) {
					var arr = UC.stringToUnit(ratio);
					
					if (!(arr[1] in cameFrom)) {
						cameFrom[arr[1]] = currentUnit; // to get to ratio, come from currentUnit
						frontier.enqueue(arr[1]);
					}
				});
			}
		}
		
		// find path to end
		var unitPath = [end];
		var currentUnit = end;
		
		while (cameFrom[currentUnit] !== undefined) {
			unitPath.push(cameFrom[currentUnit]);
			currentUnit = cameFrom[currentUnit];
		}
		
		unitPath.reverse();
		
		console.log(start + ' ' + end);
		console.log(unitPath);
		
		if (unitPath[0] !== start || unitPath[unitPath.length - 1] !== end) {
			throw new NoPathError('No valid conversion path was found.');
		}
		
		// follow the path to the end and convert using the formulas provided
		var result = quantity;
		var index = 0; // skip starting unit (we start with that already)
		
		while (index < unitPath.length - 1) {
			var currentUnit = unitPath[index];
			var nextUnit = unitPath[index + 1];
			
			var nextConversionFormula = UC.stringToUnit(UC.conversions[currentUnit].find(function(string) {
				return UC.stringToUnit(string)[1] === nextUnit;
			}));
			
			result = evaluate(nextConversionFormula[0], {x: result});
			
			++index;
		}
		
		return {
			result: result,
			path: unitPath,
		};
	}
	
	// converts a string like 'dtr(x) rad' to [[tree], 'rad']
	static stringToUnit(str) {
		var arr = str.split(' ');
		arr[0] = parse(arr[0]);
		
		return arr;
	}
	
	// returns true if a unit exists in the conversions object
	static exists(unit) {
		return UC.conversions[unit] !== undefined;
	}
}

// dimensional analysis
class DA {
	static conversions = {
		// length
		'mi': ['1760 yd', '5280 ft', '1.609344 km'],
		'yd': ['1/1760 mi', '3 ft', '36 in'],
		'ft': ['1/3 yd', '12 in'],
		'in': ['1/12 ft', '2.54 cm'],
		
		'ly': ['scientific(9.4607304725808,15) m'],
		'au': ['scientific(1.495978707,11) m'],
		'nmi': ['1.852 km'],
		'km': ['1000/1852 nmi', '1000 m', '0.621371192 mi'],
		'm': ['1/9460730472580000 ly', '1/149597870700 au', '1/1000 km', '100 cm'],
		'cm': ['1/100 m', '10 mm', '0.393700787 in'],
		'cm^3': ['1/10000 m^3', '1000 mm^3', '0.061023743907999625 in^3', '1 mL'],
		'mm': ['1/10 cm', '1000 um'],
		'um': ['1/1000 mm', '1000 nm'],
		'nm': ['1/1000 um', '10 A'],
		'A': ['1/10 nm', '100 pm'],
		'pm': ['1/100 A'],
		
		// mass
		'ton': ['2000 lb'], // us ton
		'lb': ['1/2000 ton', '16 oz', '0.453592 kg', '454 g'],
		'oz': ['1/16 lb', '28.3495231 g'],
		
		'kg': ['1000 g', '2.20462 lb'],
		'g': ['1/1000 kg', '100 cg', '0.00220462 lb', '0.0352739619 oz'],
		'cg': ['1/100 g', '10 mg'],
		'mg': ['1/10 cg', '1000 ug'],
		'ug': ['1/1000 mg', 'scientific(6.02214086,17) amu'],
		'amu': ['scientific(1.66,-18) ug'],
		
		// area
		'ha': ['100 are'],
		'are': ['0.01 ha', '100 m^2'],
		'm^2': ['1/1000000 km^2', '10000 cm^2', '1/100 are', 'scientific(1,28) b'],
		'b': ['scientific(1,-28) m^2'],
		'acre': ['4840 yd^2'],
		'yd^2': ['1/3097600 mi^2', '9 ft^2', '1296 in^2', '1/4840 acre'],
		
		// volume
		'bu': ['8 gal'],
		'gal': ['1/8 bu', '4 qt'],
		'qt': ['1/4 gal', '2 pt', '0.946352946 L'],
		'pt': ['1/2 qt', '2 c'],
		'c': ['1/2 pt', '8 floz'],
		'floz': ['1/8 c', '2 tbsp'],
		'tbsp': ['1/2 floz', '3 tsp'],
		'tsp': ['1/3 tbsp'],
		
		'kL': ['1000 L'],
		'L': ['1/1000 kL', '100 cL', '1000 mL', '1.05668821 qt'],
		'cL': ['1/100 L', '10 mL'],
		'mL': ['1/1000 L', '1/10 cL', '1000 uL', '1 cm^3'],
		'uL': ['1/1000 mL'],
		
		// time
		'cen': ['10 dec'],
		'dec': ['1/10 cen', '10 yr'],
		'yr': ['1/10 dec', '52 wk'],
		'wk': ['1/52 yr', '7 day'],
		'day': ['1/7 wk', '24 hr'],
		'hr': ['1/24 day', '60 min'],
		'min': ['1/60 hr', '60 sec'],
		'sec': ['1/60 min', '10 ds'],
		'ds': ['1/10 sec', '100 ms'],
		'ms': ['1/100 ds', '1000 us'],
		'us': ['1/1000 ms', '1000 ns'],
		'ns': ['1/1000 us'],
		
		// amount of substance
		'mol': ['scientific(6.02214086,23) atom'],
		'atom': ['scientific(1.66053904,-24) mol'],
		
		// pressure
		'cmHg': ['10 mmHg', '10 Torr'],
		'mmHg': ['1/10 cmHg', '0.00131579 atm', '1 Torr'],
		'Torr': ['1 mmHg', '1/10 cmHg', '0.00131579 atm'],
		'MPa': ['7500.62 mmHg', '1000 kPa'],
		'kPa': ['1/1000 MPa', '1000 Pa'],
		'Pa': ['1/1000 kPa', '0.000145038 psi'],
		'psi': ['6894.76 Pa', '0.0689476 bar'],
		'bar': ['14.5038 psi', '0.986923 atm'],
		'atm': ['760 mmHg', '760 Torr', '1.01325 bar'],
		
		// digital storage
		'YiB': ['1000000000000/827180612553 YB'],
		'YB': ['827180612553/1000000000000 YiB', '8 Yb'],
		'Yb': ['1/8 YB', '125 ZB'],
		'ZiB': ['500000000000/423516473627 ZB'],
		'ZB': ['0.008 Yb', '423516473627/500000000000 ZiB', '8 Zb'],
		'Zb': ['1/8 ZB', '125 EB'],
		'EiB': ['250000000000/216840434497 EB'],
		'EB': ['0.008 Zb', '216840434497/250000000000 EiB', '8 Eb'],
		'Eb': ['1/8 EB', '125 PB'],
		'PiB': ['10000000000/8881784197 PB'],
		'PB': ['0.008 Eb', '8881784197/10000000000 PiB', '8 Pb'],
		'Pb': ['1/8 PB', '125 TB'],
		'TiB': ['1000000000000/909494701773 TB'],
		'TB': ['0.008 Pb', '909494701773/1000000000000 TiB', '8 Tb'],
		'Tb': ['1/8 TB', '125 GB'],
		'GiB': ['200000000000/186264514923 GB'],
		'GB': ['0.008 Tb', '186264514923/200000000000 GiB', '8 Gb'],
		'Gb': ['1/8 GB', '125 MB'],
		'MiB': ['16384/15625 MB'],
		'MB': ['0.008 Gb', '15625/16384 MiB', '8 Mb'],
		'Mb': ['1/8 MB', '125 KB'],
		'KiB': ['1.024 KB'],
		'KB': ['0.008 Mb', '125/128 KiB', '8 Kb'],
		'Kb': ['1/8 KB', '125 byte'],
		'byte': ['0.008 Kb', '8 bit'],
		'bit': ['1/8 byte'],
	};
	
	// mark units that the program should not override with DA.additional()
	static exceptions = ['m^2', 'yd^2', 'cm^3'];
	
	static additional() {
		Object.keys(DA.conversions).forEach(function(unit) {
			if (!DA.exceptions.includes(unit)) {
				for (var i = 2; i <= 4; ++i) {
					if (!DA.exceptions.includes(unit + '^' + i)) {
						DA.conversions[unit + '^' + i] = DA.conversions[unit].slice();
						
						for (var j = 0; j < DA.conversions[unit].length; ++j) {
							var raisedUnit = DA.conversions[unit][j];
							var ratio = DA.stringToRatio(raisedUnit);
							
							ratio[0] = f.pow(ratio[0], i);
							ratio[1] = ratio[1] + '^' + i;
							
							DA.conversions[unit + '^' + i][j] = DA.ratioToString(ratio);
						}
					}
				}
			}
		});
	}
	
	// convert a single unit to another
	static convertSingle(quantity, start, end, customRatios) {
		start = start.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (match) => '^' + ss[match]);
		end = end.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (match) => '^' + ss[match]);
		
		var parsedCustom = [];
		for (var i = 0; i < customRatios.length; ++i) {
			parsedCustom[i] = DA.parseCustomRatio(customRatios[i]);
		}
		
		if (!(start in DA.conversions || DA.ratioInParsedCustom(start, parsedCustom)) || !(end in DA.conversions || DA.ratioInParsedCustom(end, parsedCustom))) {
			throw new NoUnitError('The used ratios do not exist.');
		}
		
		// search for paths from the start ratio to the end ratio
		var cameFrom = {};
		var frontier = new Queue();
		
		cameFrom[start] = undefined;
		frontier.enqueue(start);
		
		while (!frontier.empty()) {
			var currentRatio = frontier.dequeue();
			
			if (currentRatio === end) {
				break;
			}
			
			// should be defined in all users
			parsedCustom.forEach(function(obj) {
				// go through generated object's keys (unit ratios)
				for (var key in obj) {
					if (key === currentRatio && !(obj[key][1] in cameFrom)) {
						cameFrom[obj[key][1]] = currentRatio; // to get to ratio, come from currentRatio
						frontier.enqueue(obj[key][1]);
					}
				}
			});
			
			if (DA.conversions[currentRatio]) {
				DA.conversions[currentRatio].forEach(function(ratio) {
					var arr = DA.stringToRatio(ratio);
					
					if (!(arr[1] in cameFrom)) {
						cameFrom[arr[1]] = currentRatio; // to get to ratio, come from currentRatio
						frontier.enqueue(arr[1]);
					}
				});
			}
		}
		
		// find path to end
		var ratioPath = [end];
		var currentRatio = end;
		
		while (cameFrom[currentRatio] !== undefined) {
			ratioPath.push(cameFrom[currentRatio]);
			currentRatio = cameFrom[currentRatio];
		}
		
		ratioPath.reverse();
		
		console.log(start + ' ' + end);
		console.log(ratioPath);
		
		if (ratioPath[0] !== start || ratioPath[ratioPath.length - 1] !== end) {
			throw new NoPathError('No valid conversion path was found.');
		}
		
		// follow the path to the end and multiply by the corresponding ratio values from DA.conversions along the way (or from customRatios)
		var result = quantity;
		var index = 0; // skip starting ratio (we start with that already)
		
		while (index < ratioPath.length - 1) {
			var currentRatio = ratioPath[index];
			var nextRatio = ratioPath[index + 1];
			
			// look for custom ratios first, and then DA.conversions
			var nextConversionRatio = parsedCustom.find(function(obj) {
				for (var key in obj) {
					if (key === currentRatio && obj[key][1] === nextRatio) {
						return true;
					}
				}
			});
			
			if (nextConversionRatio === undefined) {
				nextConversionRatio = DA.stringToRatio(DA.conversions[currentRatio].find(function(string) {
					return DA.stringToRatio(string)[1] === nextRatio;
				}));
			} else {
				nextConversionRatio = nextConversionRatio[currentRatio];
			}
			
			result *= nextConversionRatio[0];
			
			++index;
		}
		
		return {
			result: result,
			path: ratioPath,
		};
	}
	
	// uses convertSingle to convert a dual relationship to another (e.g. miles per hour to kilometers per second)
	static convertMulti(quantity, startNum, startDen, endNum, endDen, customRatios) {
		var conv1 = DA.convertSingle(quantity, startNum, endNum, customRatios);
		var conv2 = DA.convertSingle(1, startDen, endDen, customRatios);
		
		return {
			result: conv1.result / conv2.result,
			path1: conv1.path,
			path2: conv2.path,
		};
	}
	
	// converts a string like '1/2 m' to [0.5, 'm']
	static stringToRatio(str) {
		var arr = str.split(' ');
		arr[0] = evaluate(arr[0]);
		
		return arr;
	}
	
	// reverses the above operation
	static ratioToString(ratio) {
		return ratio[0] + ' ' + ratio[1];
	}
	
	// custom ratios are stored like: '1.008 g:H/mol'
	// the program needs to understand them like {mol: [1.008, 'g:H']}, a normal ratio like in DA.conversions
	static parseCustomRatio(ratio) {
		var quantityRatio = ratio.split(' ');
		var ratioRatio = quantityRatio[1].split('/');
		
		var obj = {};
		obj[ratioRatio[0]] = [mJS.fraction(1 / quantityRatio[0]).valueOf(), ratioRatio[1]]
		obj[ratioRatio[1]] = [mJS.fraction(quantityRatio[0]).valueOf(), ratioRatio[0]];
		
		return obj;
	}
	
	// check if a ratio is mentioned in a parsed custom ratio list
	static ratioInParsedCustom(ratio, customRatios) {
		for (var i = 0; i < customRatios.length; ++i) {
			console.log(Object.keys(customRatios[i]));
			if (Object.keys(customRatios[i]).includes(ratio)) {
				return true;
			}
		}
		
		return false;
	}
}
DA.additional();

// returns an array with a number's factors
var factors = function(num) {
	num = f.abs(num);
	
	var arr = [];
	
	arr.push(1);
	
	for (var i = 2; i < f.round(num / 2) + 1; ++i) {
		if (num % i === 0) {
			arr.push(i);
		}
	}
	
	arr.push(num);
	
	return arr;
};

// returns prime factorization of number
var factorization = function(num) {
	var dividend = num;
	var arr = [];
	
	for (var i = 2; i < f.round(num / 2) + 1; ++i) {
		if (dividend === 1) {
			break;
		}
		
		if (!prime(i)) {
			continue;
		}
		
		if (dividend % i === 0) {
			arr.push(i);
			dividend /= i;
			i = 1;
		}
	}
	
	return arr;
};

// returns gcf of array of nubmers
var gcf = function(arr) {
	return arr.reduce((accumulator, currentValue) => mJS.gcd(accumulator, currentValue), arr[0]);
};

// returns lcm of array of numbers
var lcm = function(arr) {
	return arr.reduce((accumulator, currentValue) => mJS.lcm(accumulator, currentValue), arr[0]);
};

class Polynomial {
	// custom parser
	static parsePolynomial = require('./parsers/polynomial.js').parse;
	
	constructor(...coefficients) {
		this.coefficients = coefficients;
	}
	
	// create polynomial from array of coefficients
	static fromArr(arr) {
		var p = new Polynomial();
		
		arr.forEach(function(elem) {
			p.coefficients.push(Number(elem));
		});
		
		return p;
	}
	
	// create polynomial from an input string (6x^4 + 5x for example)
	static fromInput(str) {
		var p = new Polynomial();
		
		var parseResult = Polynomial.parsePolynomial(str);
		
		// find highest degree
		var max = 0;
		parseResult.forEach(function(term) {
			if (term.degree > max) {
				max = term.degree;
			}
		});
		
		p.coefficients = new Array(max + 1).fill(0);
		
		// apply terms to polynomial
		parseResult.forEach(function(term) {
			p.coefficients[-term.degree + p.coefficients.length - 1] += term.coefficient;
		});
		
		return p;
	}
	
	// greatest common factor of polynomial
	gcf() {
		var coeffGCF = gcf(this.coefficients, true);
		
		// find first term from the lowest degree of polynomial that isn't 0
		var index = this.coefficients.length - 1;
		this.coefficients.reverse().find(function(coeff, i) {
			index = i;
			return coeff !== 0;
		});
		
		this.coefficients.reverse();
		
		var arr = new Array(index + 1);
		arr[0] = coeffGCF * (this.coefficients[0] < 0 ? -1 : 1);
		arr.fill(0, 1, arr.length);
		
		return Polynomial.fromArr(arr);
	}
	
	// returns the possible rational roots of this polynomial through the rational root theorem
	rationalRoots() {
		var roots = [];
		
		var fC = factors(this.max()); // factors of first coefficient (a)
		var lC = factors(this.min()); // factors of constant
		
		// find all possible roots
		for (var i = 0; i < fC.length; ++i) {
			for (var j = 0; j < lC.length; ++j) {
				roots.push(lC[j] / fC[i]);
				roots.push(-lC[j] / fC[i]);
			}
		}
		
		// remove duplicate roots
		roots = roots.filter((root, index) => roots.indexOf(root) === index)
		
		roots.sort(function(a, b) {
			return a - b;
		});
		
		return roots;
	}
	
	// multiplies two polynomials
	static multiply(p1, p2) {
		var newPoly = new Polynomial();
		
		for (var i = 0; i <= p1.deg(); ++i) {
			for (var j = 0; j <= p2.deg(); ++j) {
				var newDegree = p1.degreeAtIndex(i) + p2.degreeAtIndex(j);
				
				if (newPoly.coefficients[newDegree] === undefined) {
					newPoly.coefficients[newDegree] = p1.atDeg(p1.degreeAtIndex(i)) * p2.atDeg(p2.degreeAtIndex(j));
				} else {
					newPoly.coefficients[newDegree] += p1.atDeg(p1.degreeAtIndex(i)) * p2.atDeg(p2.degreeAtIndex(j));
				}
			}
		}
		
		newPoly.coefficients.reverse();
		
		return newPoly;
	}
	
	// divides two polynomials with p1 having a higher degree than p2
	static synDivide(p1, p2) {
		var result = Polynomial.fromArr(p1.coefficients);
		var normalizer = p2.max();
		
		for (var i = 0; i <= p1.deg() - p2.deg(); ++i) {
			result.coefficients[i] /= normalizer;
			
			var coeff = result.coefficients[i];
			if (coeff !== 0) {
				for (var j = 1; j <= p2.deg(); ++j) {
					result.coefficients[i + j] += -p2.coefficients[j] * coeff;
				}
			}
		}
		
		var remainder = result.coefficients.splice(p1.deg() - p2.deg() + 1, result.coefficients.length);
		result.remainder = remainder;
		
		return result;
	}
	
	// factor the polynomial, returning a list of polynomials that, if multiplied, will produce (this)
	factor() {
		var mono = new Polynomial(1); // the outside monomial, the combined gcf of every other factor
		var results = [Polynomial.fromArr(this.coefficients)];
		
		var i = 0;
		while (i < results.length) { // factor polynomials; if a factor is sucessful, the index counter is reset to 0
			var p = results[i];
			
			if (p.deg() >= 2) {
				// factor out gcf
				var gcf = p.gcf();
				
				p = Polynomial.synDivide(p, gcf);
				results[i] = p;
				mono = Polynomial.multiply(mono, gcf);
				
				var roots = p.rationalRoots();
				for (var j = 0; j < roots.length; ++j) {
					var root = roots[j];
					
					// try factoring out a binomial of degree 1
					var bin1 = new Polynomial(1, root);
					var quotient = Polynomial.synDivide(p, bin1);
					
					if (quotient.remainder.every((num) => num === 0) && quotient.coefficients.length > 1) { // if the division divides cleanly (with no remainder), quotient and root are factors
						results.splice(i, 1, bin1, quotient);
						
						i = -1;
						break;
					} // otherwise, it does not divide cleanly, so ignore it
					
					// try factoring out a binomial of degree 2
					var bin2 = new Polynomial(1, 0, root);
					var quotient = Polynomial.synDivide(p, bin2);
					
					if (quotient.remainder.every((num) => num === 0) && quotient.coefficients.length > 1) { // if the division divides cleanly (with no remainder), quotient and root are factors
						results.splice(i, 1, bin2, quotient);
						
						i = -1;
						break;
					}
				}
			}
			
			++i;
		}
		
		// go through all factors and simplify unclean ones, like change (x - 0.5) to (2x - 1)
		results.forEach(function(factor, index) {
			if (factor.min() !== 0) {
				if (factor.deg() === 1) {
					var dec = factor.coefficients[1] / factor.coefficients[0];
					var frac = mJS.fraction(dec);
					
					var multiMono = factor.coefficients[0] / frac.d;
					
					factor.coefficients[0] = frac.d;
					factor.coefficients[1] = frac.n * frac.s;
					
					mono = Polynomial.multiply(mono, new Polynomial(multiMono));
				}
			}
		});
		
		results.unshift(mono);
		
		return results;
	}
	
	// return the degree of the polynomial
	deg() {
		return this.coefficients.length - 1;
	}
	
	// return the coefficient of the highest degree of the polynomial (aka the first coefficient)
	max() {
		return this.coefficients[0];
	}
	
	// return the coefficient of degree 0 (the constant)
	min() {
		return this.coefficients[this.coefficients.length - 1];
	}
	
	// returns the amount of terms the polynomial has
	terms() {
		return this.coefficients.filter(function(num) {
			return num !== 0;
		});
	}
	
	// return the coefficient of the term that has degree 'deg'
	atDeg(deg) {
		return this.coefficients[-deg + this.coefficients.length - 1];
	}
	
	// return the degree of the term at index 'index'
	degreeAtIndex(index) {
		return this.coefficients.length - index - 1;
	}
	
	toString(variable = 'x') {
		var str = '';
		
		if (this.coefficients.length === 1) {
			return this.coefficients[0];
		}
		
		this.coefficients.forEach(function(c, index, arr) {
			var deg = -index + arr.length - 1;
			
			if (c === 0) {
				
			} else if (index === arr.length - 1) {
				str += c;
			} else if ((c < -1 || c > 1) || !(isInt(c))) {
				str += c;
			} else if (c === -1) {
				str += '-';
			}
			
			if (c !== 0 && deg >= 1) {
				str += variable;
				
				if (deg > 1) {
					str += '^' + deg;
				}
			}
			
			// is there a term afterwards?
			if (index + 1 <= arr.length - 1) {
				if (arr[index + 1] > 0) {
					str += '+';
				}
			}
		});
		
		return str;
	}
}

// various matrix operations
class Matrix {
	constructor(...rows) {
		this.matrix = rows;
		this.dimensions = [rows.length, rows[0].length]; // row by column
	}
	
	// converts an input of rows ([1, 2, 3] [4, 5, 6]) into a matrix
	static fromInput(str) {
		// remove all spaces
		str = str.replace(/\s/g, '');
		
		// isolate all the rows
		var rows = str.match(/\[.+?\]/g);
		
		// remove the brackets and convert the row into an array of numbers
		rows.forEach(function(row, index) {
			row = row.replace(/[\[\]]/g, '');
			
			row = row.split(',');
			
			row.forEach((num, index) => row[index] = mJS.fraction(num).valueOf());
			
			rows[index] = row;
		});
		
		var m = new Matrix([[0]]);
		m.matrix = rows;
		m.dimensions = [rows.length, rows[0].length];
		
		return m;
	}
	
	// returns true if a specified callback test sends true on each element in the matrix
	// callback(current matrix element, position in matrix, reference to matrix)
	every(callback) {
		for (var r = 0; r < this.dimensions[0]; ++r) {
			for (var c = 0; c < this.dimensions[1]; ++c) {
				if (!callback(this.matrix[r][c], [r, c], this)) {
					return false;
				}
			}
		}
		
		return true;
	}
	
	// gets the element at (row, column)
	get(r, c) {
		return this.matrix[r][c];
	}
	
	// sets the element at (row, column)
	set(r, c, v) {
		this.matrix[r][c] = v;
	}
	
	// solve linear system through gaussian elimination
	static gaussian(matrix) {
		var n = matrix.dimensions[0];
		
		for (var i = 0; i < n; ++i) {
			// search for maximum in this column
			var maxEl = mJS.abs(matrix.get(i, i));
			var maxRow = i;
			
			for (var k = i + 1; k < n; ++k) {
				if (mJS.abs(matrix.get(k, i)) > maxEl) {
					maxEl = mJS.abs(matrix.get(k, i));
					maxRow = k;
				}
			}
			
			// swap maximum row with current row (column by column)
			for (var k = i; k < n + 1; ++k) {
				var tmp = matrix.matrix[maxRow][k];
				matrix.set(maxRow, k, matrix.get(i, k));
				matrix.set(i, k, tmp);
			}
			
			// make all rows below this one 0 in current column
			for (k = i + 1; k < n; ++k) {
				var c = -matrix.get(k, i) / matrix.get(i, i);
				for (var j = i; j < n + 1; ++j) {
					if (i == j) {
						matrix.set(k, j, 0);
					} else {
						matrix.set(k, j, matrix.get(k, j) + c * matrix.get(i, j));
					}
				}
			}
		}
		
		// solve equation Ax=b for an upper triangular matrix A
		var x = new Array(n);
		for (var i = n - 1; i > -1; --i) {
			x[i] = matrix.get(i, n) / matrix.get(i, i);
			
			for (var k = i - 1; k > -1; --k) {
				matrix.set(k, n, matrix.get(k, n) - matrix.get(k, i) * x[i]);
			}
		}
		
		// throw error if any value is NaN
		if (matrix.every((elem) => !isNaN(elem))) {
			return new Matrix(x);
		} else {
			throw 'NaN value in matrix gaussian!';
		}
	}
	
	toString() {
		var str = '';
		
		for (var i = 0; i < this.matrix.length; ++i) {
			str += '[' + this.matrix[i].join(', ') + ']'
		}
		
		return str;
	}
}
 
class Radical {
	// coefficient * root of radicand
	constructor(coefficient, index, radicand) {
		this.coefficient = coefficient;
		this.index = index; // should be greater than 1 (the value that indicates a square root, cube root, etc.)
		this.radicand = radicand;
	}
	
	// converts an input (e.g. '4[2](5)' to a radical
	static fromInput(str) {
		var matches = str.match(/([\d\.\-]+?)\[([\d\.\-]+?)\]\(([\d\.\-]+?)\)/);
		return new Radical(Number(matches[1]), Number(matches[2]), Number(matches[3]));
	}
	
	// returns a simplified version of the radical
	simplify() {
		var r = new Radical(this.coefficient, this.index, this.radicand);
		
		for (var i = f.round(r.valueOf() / this.coefficient); i >= r.index; --i) {
			if (r.radicand % f.pow(i, r.index) === 0) {
				r.coefficient *= i;
				r.radicand /= f.pow(i, r.index);
			}
		}
		
		return r;
	}
	
	// returns the value of the radical
	valueOf() {
		return this.coefficient * f.root(this.index, this.radicand);
	}
	
	// approximates a radical from a given number
	static approximate(num, index) {
		var coeff = 1;
		var radicand = f.round(f.pow(num, index));
		
		return new Radical(coeff, index, radicand).simplify();
	}
	
	toString() {
		// square root symbol for no reason: √
		return this.coefficient + '[' + this.index + ']' + '(' + this.radicand + ')';
	}
	
	toWord() {
		return this.coefficient + ' times ' + this.index + numSuffix(this.index) + ' root of ' + this.radicand;
	}
}

// represents a sequence of numbers
class Sequence {
	constructor(...nums) {
		this.nums = nums;
		this.type = 'unknown';
	}
	
	// constructs a sequence from an array of numbers
	static fromArr(arr) {
		var s = new Sequence();
		s.type = 'unknown';
		
		arr.forEach(function(elem) {
			s.nums.push(mJS.fraction(elem));
		});
		
		return s;
	}
	
	// returns a sequence from a formula in terms of n
	static fromFormula(start, end, input, mode, calcVars, customFunctions) {
		start = Number(start);
		end = Number(end);
		
		if (start === end) {
			throw new RangeError('Start and end values of sequence formula are the same.');
		} else if (start > end) {
			throw new RangeError('Start value in sequence formula is greater than end value.');
		} else if (end - start > 50) {
			throw new RangeError('Too many terms!');
		} else if (isNaN(start) || isNaN(end)) {
			throw new TypeError('Expected number.');
		}
		
		input = parse(input);
		var s = new Sequence();
		s.type = 'unknown';
		
		for (var i = start; i <= end; ++i) {
			var num = mJS.fraction(evaluate(input, Object.assign({n: i}, calcVars), mode));
			s.nums.push(num);
		}
		
		return s;
	}
	
	// construct a sequence given two values of the sequence and where they lie in the sequence
	static fromValues(posStart, start, posEnd, end, type = 'arithmetic') {
		posStart = Number(posStart);
		posEnd = Number(posEnd);
		
		if (posStart === posEnd) {
			throw new RangeError('Start and end values of sequence formula are the same.');
		} else if (posStart > posEnd) {
			throw new RangeError('Start value in sequence formula is greater than end value.');
		} else if (posEnd - posStart > 50) {
			throw new RangeError('Too many terms!');
		} else if (isNaN(posStart) || isNaN(posEnd)) {
			throw new TypeError('Expected number.');
		}
		
		var s = new Sequence();
		s.nums = new Array(posEnd - posStart + 1);
		s.nums[0] = mJS.fraction(start);
		s.nums[s.nums.length - 1] = mJS.fraction(end);
		s.type = type;
		
		var diff = 0;
		
		if (type === 'arithmetic') {
			diff = (s.end() - s.start()) / (posEnd - posStart);
		} else if (type === 'geometric') {
			diff = f.root(posEnd - posStart, s.end() / s.start());
		}
		
		for (var i = 1; i < s.length() - 1; ++i) {
			s.nums[i] = mJS.fraction(s.nums[0] + diff * i);
		}
		
		return s;
	}
	
	// construct a sequence given the first term, a common difference, and the amount of terms
	static fromDifference(start, difference, terms = 10, type = 'arithmetic') {
		start = mJS.fraction(start);
		difference = mJS.fraction(difference);
		terms = Number(terms);
		
		if (terms > 50) {
			throw new RangeError('Too many terms!');
		} else if (isNaN(terms)) {
			throw new TypeError('Expected number.');
		}
		
		var s = new Sequence();
		s.type = type;
		
		for (var i = 0; i < terms; ++i) {
			s.nums[i] = mJS.fraction(start + i * difference);
		}
		
		return s;
	}
	
	// predicts and returns the next number in the sequence, assuming it is an arithmetic / geometric one
	extend() {
		var table = this.diffTable();
		
		// no difference table could be created
		if (table === undefined) {
			return undefined;
		}
		
		// extend the sequence based on the type of the diff table
		for (var i = table.length - 1; i >= 0; --i) {
			if (i === table.length - 1) {
				table[i].push(table[i][0]);
			} else {
				table[i].push(table.type === 'arithmetic' ? table[i][table[i].length - 1] + table[i + 1][table[i + 1].length - 1] : table[i][table[i].length - 1] * table[i + 1][table[i + 1].length - 1]);
			}
		}
		
		// next value
		return table[0][table[0].length - 1];
	}
	
	// calculates a formula for the sequence and returns a polynomial, returning undefined if the diff table couldn't be found
	formula(startingTerm = 1) {
		var table = this.diffTable();
		
		if (table === undefined) {
			return undefined;
		}
		
		var values = [];
		
		this.nums.forEach(function(frac, index) {
			values.push([index + startingTerm, frac.valueOf()]);
		});
		
		if (table.type === 'arithmetic') {
			return Polynomial.fromArr(regression.polynomial(values, {order: table.order, precision: 10}).equation);
		} else {
			return regression.polynomial(values, {precision: 10}).string;
		}
	}
	
	// returns length of sequence
	length() {
		return this.nums.length;
	}
	
	// returns the first term of the sequence
	start() {
		return this.nums[0];
	}
	
	// returns the last term of the sequence
	end() {
		return this.nums[this.nums.length - 1];
	}
	
	// returns sum of sequence
	sum() {
		return this.nums.reduce((accumulator, current) => accumulator + current);
	}
	
	// generate a difference table for the sequence, returning undefined if not possible
	// the resulting array has special properties: {type: a string, either 'arithmetic' or 'geometric', common: the common difference, order: the amount of differences it took to reach a common difference}
	diffTable() {
		// while this is true, allow testing of geometric sequence
		var testGeometric = true;
		
		// each successful array in the tables is one element shorter, once we get to a point where the numbers in an array are the same, we have successfully found the arithmetic sequence
		var aTable = [this.nums]; 
		var gTable = [this.nums];
		
		// generate difference table
		while (!aTable[aTable.length - 1].every((elem, index, arr) => elem.valueOf() === arr[0].valueOf()) && (testGeometric && !gTable[gTable.length - 1].every((elem, index, arr) => elem.valueOf() === arr[0].valueOf()))) {
			aTable.push(new Array(aTable[aTable.length - 1].length - 1));
			
			if (testGeometric) {
				gTable.push(new Array(gTable[gTable.length - 1].length - 1));
			}
			
			var aStart = aTable[aTable.length - 2];
			var aDiffs = aTable[aTable.length - 1];
			
			var gStart = gTable[gTable.length - 2];
			var gDiffs = gTable[gTable.length - 1];
			
			if (aDiffs.length === 1 && (testGeometric && gDiffs.length === 1)) {
				return undefined;
			}
			
			for (var i = 0; i < aDiffs.length; ++i) {
				aDiffs[i] = mJS.fraction(aStart[i + 1] - aStart[i]);
			}
			
			if (testGeometric) {
				for (var i = 0; i < gDiffs.length; ++i) {
					if (gStart[i].valueOf() === 0) { // division by 0!
						testGeometric = false;
						break;
					}
					
					gDiffs[i] = mJS.fraction(gStart[i + 1] / gStart[i]);
				}
			}
		}
		
		if (aTable[aTable.length - 1].every((elem, index, arr) => elem.valueOf() === arr[0].valueOf())) {
			this.type = 'arithmetic';
			aTable.type = 'arithmetic';
			aTable.common = aTable[aTable.length - 1][0];
			aTable.order = aTable.length - 1;
			return aTable;
		} else if (testGeometric && gTable[gTable.length - 1].every((elem, index, arr) => elem.valueOf() === arr[0].valueOf())) {
			this.type = 'geometric';
			gTable.type = 'geometric';
			gTable.common = gTable[gTable.length - 1][0];
			gTable.order = gTable.length - 1;
			return gTable;
		} else {
			return undefined;
		}
	}
	
	toString() {
		var str = '';
		
		this.nums.forEach(function(num, index, arr) {
			str += num.toFraction() + (index < arr.length - 1 ? ', ' : '');
		}, this);
		
		return str;
	}
}

// construct a graph, draw expressions, and export the drawing to a png buffer
class Graph {
	/*
	gridScale = 0 (auto)
	options: {
		pointsAtRoots: false, // add points at x-intercepts of expressions
	}
	*/
	constructor(width = 1000, height = 1000, center = [0, 0], scale = 10, gridScale = 0, options) {
		this.width = width;
		this.height = height;
		this.expressions = [];
		this.points = [];
		
		this.options = options;
		
		// render data
		this.center = center;
		this.scale = scale;
		this.gridScale = gridScale;
	}
	
	addPoint(pos, label, color) {
		this.points.push({
			pos: pos,
			label: label,
			color: color,
		});
	}
	
	// labels are automatically set by the point's position
	// random colors are chosen for each point
	addPoints(points) {
		points.forEach(function(point) {
			var rounded = [f.round(point[0], this.scale / 10000), f.round(point[1], this.scale / 10000)];
			
			this.points.push({
				pos: point,
				label: '(' + rounded[0] + ', ' + rounded[1] + ')',
				color: 'rgb(' + randomRgb().join(',') + ')',
			});
		}, this);
	}
	
	addExpression(exp, label, color) {
		this.expressions.push({
			exp: exp,
			label: label,
			color: color,
		});
	}
	
	// render the graph to a buffer which can be converted into an image
	render(trigMode) {
		var selectedGridScale = f.abs(this.gridScale);
		
		// the calculated grid scale is 1/4 of the scale
		if (selectedGridScale === 0) {
			selectedGridScale = f.round(this.scale / 4);
		}
		
		var canvas = new Canvas.createCanvas(this.width, this.height);
		var ctx = canvas.getContext('2d');
		
		ctx.font = '50px sans-serif';
		ctx.fillStyle = 'rgb(255, 255, 255)';
		ctx.lineWidth = 5;
		
		// draw grid
		ctx.strokeStyle = 'rgb(100, 100, 100)';
		
		for (var i = this.center[0] - this.scale; i <= this.center[0] + this.scale; ++i) {
			if (i % selectedGridScale === 0) {
				ctx.beginPath();
				ctx.moveTo(this.xToCanvas(i), 0);
				ctx.lineTo(this.xToCanvas(i), this.height);
				ctx.stroke();
				
				ctx.beginPath();
				ctx.moveTo(0, this.yToCanvas(i));
				ctx.lineTo(this.width, this.yToCanvas(i));
				ctx.stroke();
			}
		}
		
		ctx.textAlign = 'left';
		ctx.fillText('Grid scale: ' + selectedGridScale, 20, 50);
		
		// draw axes
		ctx.strokeStyle = 'rgb(255, 255, 255)';
		
		ctx.beginPath(); // x
		ctx.moveTo(0, this.yToCanvas(0));
		ctx.lineTo(this.width, this.yToCanvas(0));
		ctx.stroke();

		ctx.beginPath(); // y
		ctx.moveTo(this.xToCanvas(0), 0);
		ctx.lineTo(this.xToCanvas(0), this.height);
		ctx.stroke();
		
		// draw numbers
		// x axis numbers
		var vertPos = this.yToCanvas(0) - 10; // calculate it once and use for both numbers
		
		if (vertPos <= 30) {
			vertPos = 30;
		} else if (vertPos >= this.height - 10) {
			vertPos = this.height - 10;
		}
		
		ctx.textAlign = 'left';
		ctx.fillText(this.canvasToX(0), 10, vertPos);
		
		ctx.textAlign = 'right';
		ctx.fillText(this.canvasToX(this.width), this.width - 10, vertPos);
		
		// y axis numbers
		var horPos = this.xToCanvas(0) + 10;
		
		if (horPos <= 10) {
			horPos = 10;
		} else if (horPos >= this.width - 10) {
			horPos = this.width - 10;
		}
		
		ctx.textAlign = 'left';
		ctx.fillText(this.canvasToY(0), horPos, 50);
		ctx.fillText(this.canvasToY(this.height), horPos, this.height - 10);
		
		// draw objects
		// draw functions
		this.expressions.forEach(function(exp) {
			var str = exp.exp.toString();
			
			ctx.strokeStyle = exp.color;
			ctx.beginPath();
			
			var drawing = false;
			var trackRoot = 0; // used for options.pointsAtRoots
			if (/^r=/.test(str) && /\b(theta|x)\b/.test(str)) { // polar function
				var parsed = parse(str.substring(str.indexOf('=') + 1));
				for (var i = 0; i < this.scale * 5; i += this.scale / 128) {
					var r = evaluate(parsed, {theta: i, x: i}, trigMode);
					var point = this.pointToCanvas(r * f.cos(i), r * f.sin(i));
					
					if (!drawing) {
						if (point[0] >= -1000 && point[0] <= this.height + 1000 && point[1] >= -1000 && point[1] <= this.height + 1000) {
							drawing = true;
							ctx.beginPath();
							ctx.moveTo(point[0], point[1]);
						}
					} else {
						if (point[0] >= -1000 && point[0] <= this.height + 1000 && point[1] >= -1000 && point[1] <= this.height + 1000) {
							ctx.lineTo(point[0], point[1]);
						} else {
							ctx.stroke();
							drawing = false;
						}
					}
				}
			} else if (/^(y|f\(x\))=/.test(exp.exp)) { // function of x
				var parsed = parse(str.substring(str.indexOf('=') + 1));
				for (var i = 0; i <= this.width; i += this.scale / 8) {
					var x = this.canvasToX(i);
					var y = evaluate(parsed, {x: x}, trigMode);
					var point = [i, this.yToCanvas(y)];
					
					if (this.options.pointsAtRoots) {
						if (i === 0) {
							trackRoot = y;
						}
						
						if (f.polarity(trackRoot) !== f.polarity(y) || f.polarity(y) === 0) {
							this.addPoint([x, y], '(' + x.toFixed(3) +', 0)', 'rgb(' + randomRgb().join(',') + ')');
						}
						
						trackRoot = y;
					}
					
					if (!drawing) {
						if (point[1] >= -1000 && point[1] <= this.height + 1000) {
							drawing = true;
							ctx.beginPath();
							ctx.moveTo(point[0], point[1]);
						}
					} else {
						if (point[1] >= -1000 && point[1] <= this.height + 1000) {
							ctx.lineTo(point[0], point[1]);
						} else {
							ctx.stroke();
							drawing = false;
						}
					}
				}
			}
			
			ctx.stroke();
		}, this);
		
		// draw points
		this.points.forEach(function(point) {
			var next = this.pointToCanvas(point.pos[0], point.pos[1]);
			ctx.fillStyle = point.color;
			ctx.beginPath();
			ctx.ellipse(next[0], next[1], 10, 10, 0, 0, 2 * Math.PI);
			ctx.fill();
			
			ctx.fillText(point.label, next[0] + 15, next[1] - 15);
		}, this);
		
		return canvas.toBuffer('image/png');
	}
	
	// convert a single x location to its pixel representaion
	xToCanvas(x) {
		return this.width / (2 * this.scale) * (x - this.center[0]) + this.width / 2;
	}
	
	// convert an x pixel representaion to a graph location
	canvasToX(x) {
		return 2 * this.scale * (x - this.width / 2) / this.width + this.center[0];
	}
	
	// convert a single y location to its pixel representaion
	yToCanvas(y) {
		return -this.height / (2 * this.scale) * (y - this.center[1]) + this.height / 2;
	}
	
	// convert an y pixel representaion to a graph location
	canvasToY(y) {
		return -2 * this.scale * (y - this.height / 2) / this.height + this.center[1];
	}
	
	// convert a point on the graph to its representation in pixels on canvas
	pointToCanvas(x, y) {
		return [this.width / (2 * this.scale) * (x - this.center[0]) + this.width / 2, -this.height / (2 * this.scale) * (y - this.center[1]) + this.height / 2]
	}
	
	// returns the average of all points in the graph
	// set scale will choose a scale value that allows all graph points to be seen
	pointAverage(setScale = false) {
		var total = this.points.reduce(function(accumulator, current) {
			return [accumulator[0] + current[0], accumulator[1] + current[1]];
		}, [0, 0]);
		
		if (setScale) {
			var max = mJS.max(total);
			this.scale = max;
		}
		
		return [total[0] / this.points.length, total[1] / this.points.length];
	}
}

module.exports = {
	constants: ['tau', 'τ', 'pi', 'π', 'e', 'phi', 'φ', 'i'],
	predefined: ['parse', 'numSuffix', 'hexToRgb', 'randomRgb', 'findExpressionLimitsHere', 'convertCeval', 'convertToMJSUsable', 'convertToUsable', 'isInt', 'sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'asin', 'acos', 'atan', 'asec', 'acsc', 'acot', 'dtr', 'rtd', 'log', 'ln', 'sqrt', 'cbrt', 'root', 'pow', 'factorial', 'abs', 'ceil', 'floor', 'round', 'clamp', 'prime', 'polarity', 'factors', 'factorization', 'gcf', 'lcm'],
	
	// errors
	ComputationError: ComputationError,
	TokenizationError: TokenizationError,
	NoFormulaError: NoFormulaError,
	NoPathError: NoPathError,
	NoUnitError: NoUnitError,
	
	convertToMJSUsable: convertToMJSUsable,
	convertToUsable: convertToUsable,
	
	derivative: mJS.derivative,
	integral: alG.integral,
	simplify: mJS.simplify,
	fraction: mJS.fraction,
	
	parse: parse,
	
	clamp: f.clamp,
	normalToSuper: normalToSuper,
	superToNormal: superToNormal,
	numSuffix: numSuffix,
	
	// .calculate
	calc: {
		// average of numbers in an array
		avg: function(n) {
			var result = 0;
			
			for (var i = 0; i < n.length; ++i) {
				result += Number(n[i]);
			}
			
			return result / n.length;
		},
		
		// solve for roots using newton-raphson method
		newtonMethod: function(name, equ, derv, initialGuess = 0) {
			if (!isFinite(initialGuess)) {
				initialGuess = 0;
			}
			
			var obj = {};
			obj[name] = initialGuess;
			
			equ = parse(equ);
			derv = parse(derv);
			
			var equs = evaluate(equ, obj);
			var dervs = evaluate(derv, obj);
			
			for (var i = 0; i < 10; ++i) {
				obj[name] = obj[name] - equs / dervs;
				equs = evaluate(equ, obj);
				dervs = evaluate(derv, obj);
			}
			
			return mJS.fraction(obj[name]).valueOf();
		},
		
		// numeric integration of expression (variable, expression, bound 1, bound 2)
		numIntegrate: function(variable, exp, b1, b2) {
			var result = 0;
			
			var scope = {};
			
			for (var i = b1; i < b2; i += 0.0001) {
				scope[variable] = i;
				result += evaluate(exp, scope) * 0.0001;
			}
			
			result *= 1.0000300007; // precision issue
			
			return result;
		},
		
		convertCeval: convertCeval,
		
		// converts array of elements (or string) to math string and evaluates it
		ceval: function(exp, mode, calcVars, customFunctions) {
			if (typeof exp !== 'string') {
				exp = exp.join('').toLowerCase();
			} else {
				exp = exp.split(' ').join('').toLowerCase();
			}
			
			return evaluateInfo(exp, calcVars, mode).result;
		},
		
		// runs "eval" in this scope
		unsafeEval: function(exp) {
			return new Function('', 'return ' + exp).apply();
		},
		
		expand: function(exp) {
			exp = parse(exp).toString();
			
			var result = convertToUsable(nerdamer('expand(' + convertToMJSUsable(exp) + ')').toString()).replace(/\*/g, '\\*');
			
			return result;
		},
		
		solveFor: function(variable, exp) {
			try {
				exp = parse(exp).toString();
				
				var results = nerdamer('solve(' + convertToMJSUsable(exp) + ', ' + variable + ')').toString().replace(/[\[\]]/g, '').split(',');
				
				if (results.length === 1 && results[0] === '') { // no solution found
					return undefined;
				} else {
					results.forEach(function(result, index) {
						results[index] = convertToUsable(mJS.simplify(result).toString()).replace(/\*/g, '\\*');
					});
					
					return results;
				}
			} catch (e) {
				console.log(e);
				return undefined;
			}
		},
	},
	
	// .factor
	fac: {
		factors: factors,
		factorization: factorization,
		gcf: gcf,
		lcm: lcm,
	},
	
	// return a buffer of a graph given an array of points (length 2 array) and expressions
	graph: function(points, expressions, options, trigMode) {
		var graph = new Graph(1000, 1000, [0, 0], 10, 0, options);
		
		points.forEach(function(point, index) {
			graph.addPoint(point, 'p' + index, 'rgb(' + randomRgb().join(',') + ')');
		});
		
		expressions.forEach(function(exp, index) {
			graph.addExpression(exp, 'e' + index, 'rgb(' + randomRgb().join(',') + ')');
		});
		
		return graph.render(trigMode);
	},
	
	// takes input data and the type of regression (e.g. polynomial, linear) and returns an oject with the equation in string form
	regression: function(input, type, degree = 0) {
		var matches = input.match(/\((.+?)\)/g) || input.match(/\[(.+?)\]/g);
		var inputType = matches[0].includes('(') && matches[0].includes(')') ? 'point' : 'list'; // whether the user entered the data as points or as list of x / y coordinates
		
		matches.forEach(function(data, index) {
			matches[index] = data.substring(1, data.length - 1).split(',');
			matches[index].forEach((num, index, arr) => arr[index] = mJS.fraction(num).valueOf());
		});
		
		var points = [];
		if (inputType === 'point') {
			points = matches;
		} else {
			// make sure there are enough list and both lists are same length
			if (matches.length !== 2) {
				throw new RangeError('Incorrect amount of lists passed. (Expected 2)');
			} else if (matches[0].length !== matches[1].length) {
				throw new RangeError('Lists aren\'t of same length.');
			}
			
			for (var i = 0; i < matches[0].length; ++i) {
				points.push([matches[0][i], matches[1][i]]);
			}
		}
		
		var result = undefined;
		
		if (type === 'linear') {
			result = regression.linear(points, {precision: 10});
		} else if (type === 'exponential') {
			result = regression.exponential(points, {precision: 10});
		} else if (type === 'polynomial') {
			result = regression.polynomial(points, {order: degree, precision: 10});
		} else if (type === 'power') {
			result = regression.power(points, {precision: 10});
		}
		
		result.string = result.string.split(' ').join('');
		result.r = f.sqrt(result.r2);
		
		var graph = new Graph(1000, 1000, [0, 0], 10, 0);
		graph.addPoints(points);
		graph.center = graph.pointAverage(true);
		result.buffer = graph.render();
		
		return result;
	},
	
	isInt: isInt,
	
	UC: UC,
	DA: DA,
	Vector: Vector,
	Formula: Formula,
	Polynomial: Polynomial,
	Matrix: Matrix,
	Radical: Radical,
	Sequence: Sequence,
	
	Queue: Queue,
}