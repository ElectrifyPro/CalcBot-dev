// bot's chemistry module

var mjs = require('mathjs');
var levenshtein = require('./notmath.js').levenshtein;

class Element {
	// every element and its info
	static elems = [
		new Element('Hydrogen', 1, 'H', 1, 1, 'Nonmetal', 'Other', 'Gas', 1.008),
		new Element('Helium', 2, 'He', 18, 1, 'Nonmetal', 'Noble gas', 'Gas', 4),
		new Element('Lithium', 3, 'Li', 1, 2, 'Metal', 'Alkali', 'Solid', 6.94),
		new Element('Beryllium', 4, 'Be', 2, 2, 'Metal', 'Alkail earth', 'Solid', 9.01),
		new Element('Boron', 5, 'B', 13, 2, 'Metalloid', undefined, 'Solid', 10.81),
		new Element('Carbon', 6, 'C', 14, 2, 'Nonmetal', 'Other', 'Solid', 12.01),
		new Element('Nitrogen', 7, 'N', 15, 2, 'Nonmetal', 'Other', 'Gas', 14.01),
		new Element('Oxygen', 8, 'O', 16, 2, 'Nonmetal', 'Other', 'Gas', 16),
		new Element('Fluorine', 9, 'F', 17, 2, 'Nonmetal', 'Other', 'Gas', 19),
		new Element('Neon', 10, 'Ne', 18, 2, 'Nonmetal', 'Noble gas', 'Gas', 20.18),
		new Element('Sodium', 11, 'Na', 1, 3, 'Metal', 'Alkali', 'Solid', 22.99),
		new Element('Magnesium', 12, 'Mg', 2, 3, 'Metal', 'Alkail earth', 'Solid', 24.3),
		new Element('Aluminum', 13, 'Al', 13, 3, 'Metal', 'Post-transition', 'Solid', 26.98),
		new Element('Silicon', 14, 'Si', 14, 3, 'Metalloid', undefined, 'Solid', 28.09),
		new Element('Phosphorus', 15, 'P', 15, 3, 'Nonmetal', 'Other', 'Solid', 30.97),
		new Element('Sulfur', 16, 'S', 16, 3, 'Nonmetal', 'Other', 'Solid', 32.06),
		new Element('Chlorine', 17, 'Cl', 17, 3, 'Nonmetal', 'Other', 'Gas', 35.45),
		new Element('Argon', 18, 'Ar', 18, 3, 'Nonmetal', 'Noble gas', 'Gas', 39.95),
		new Element('Potassium', 19, 'K', 1, 4, 'Metal', 'Alkali', 'Solid', 39.1),
		new Element('Calcium', 20, 'Ca', 2, 4, 'Metal', 'Alkail earth', 'Solid', 40.08),
		new Element('Scandium', 21, 'Sc', 3, 4, 'Metal', 'Transition', 'Solid', 44.96),
		new Element('Titanium', 22, 'Ti', 4, 4, 'Metal', 'Transition', 'Solid', 47.87),
		new Element('Vanadium', 23, 'V', 5, 4, 'Metal', 'Transition', 'Solid', 50.94),
		new Element('Chromium', 24, 'Cr', 6, 4, 'Metal', 'Transition', 'Solid', 52),
		new Element('Manganese', 25, 'Mn', 7, 4, 'Metal', 'Transition', 'Solid', 54.94),
		new Element('Iron', 26, 'Fe', 8, 4, 'Metal', 'Transition', 'Solid', 55.85),
		new Element('Cobalt', 27, 'Co', 9, 4, 'Metal', 'Transition', 'Solid', 58.93),
		new Element('Nickel', 28, 'Ni', 10, 4, 'Metal', 'Transition', 'Solid', 58.69),
		new Element('Copper', 29, 'Cu', 11, 4, 'Metal', 'Transition', 'Solid', 63.55),
		new Element('Zinc', 30, 'Zn', 12, 4, 'Metal', 'Transition', 'Solid', 65.38),
		new Element('Gallium', 31, 'Ga', 13, 4, 'Metal', 'Post-transition', 'Solid', 69.72),
		new Element('Germanium', 32, 'Ge', 14, 4, 'Metalloid', undefined, 'Solid', 72.63),
		new Element('Arsenic', 33, 'As', 15, 4, 'Metalloid', undefined, 'Solid', 74.92),
		new Element('Selenium', 34, 'Se', 16, 4, 'Nonmetal', 'Other', 'Solid', 78.97),
		new Element('Bromine', 35, 'Br', 17, 4, 'Nonmetal', 'Other', 'Liquid', 79.9),
		new Element('Krypton', 36, 'Kr', 18, 4, 'Nonmetal', 'Noble gas', 'Gas', 83.8),
		new Element('Rubidium', 37, 'Rb', 1, 5, 'Metal', 'Alkali', 'Solid', 85.47),
		new Element('Strontium', 38, 'Sr', 2, 5, 'Metal', 'Alkail earth', 'Solid', 87.62),
		new Element('Yttrium', 39, 'Y', 3, 5, 'Metal', 'Transition', 'Solid', 88.91),
		new Element('Zirconium', 40, 'Zr', 4, 5, 'Metal', 'Transition', 'Solid', 91.22),
		new Element('Niobium', 41, 'Nb', 5, 5, 'Metal', 'Transition', 'Solid', 92.91),
		new Element('Molybdenum', 42, 'Mo', 6, 5, 'Metal', 'Transition', 'Solid', 95.95),
		new Element('Technetium', 43, 'Tc', 7, 5, 'Metal', 'Transition', 'Solid', 97),
		new Element('Ruthenium', 44, 'Ru', 8, 5, 'Metal', 'Transition', 'Solid', 101.1),
		new Element('Rhodium', 45, 'Rh', 9, 5, 'Metal', 'Transition', 'Solid', 102.91),
		new Element('Palladium', 46, 'Pd', 10, 5, 'Metal', 'Transition', 'Solid', 406.42),
		new Element('Silver', 47, 'Ag', 11, 5, 'Metal', 'Transition', 'Solid', 107.87),
		new Element('Cadmium', 48, 'Cd', 12, 5, 'Metal', 'Transition', 'Solid', 112.41),
		new Element('Indium', 49, 'In', 13, 5, 'Metal', 'Post-transition', 'Solid', 114.82),
		new Element('Tin', 50, 'Sn', 14, 5, 'Metal', 'Post-transition', 'Solid', 118.71),
		new Element('Antimony', 51, 'Sb', 15, 5, 'Metalloid', undefined, 'Solid', 121.76),
		new Element('Tellurium', 52, 'Te', 16, 5, 'Metalloid', undefined, 'Solid', 127.6),
		new Element('Iodine', 53, 'I', 17, 5, 'Nonmetal', 'Other', 'Solid', 126.9),
		new Element('Xenon', 54, 'Xe', 18, 5, 'Nonmetal', 'Noble gas', 'Gas', 131.29),
		new Element('Cesium', 55, 'Cs', 1, 6, 'Metal', 'Alkali', 'Solid', 132.91),
		new Element('Barium', 56, 'Ba', 2, 6, 'Metal', 'Alkail earth', 'Solid', 137.33),
		new Element('Lanthanum', 57, 'La', 3, 6, 'Metal', 'Lanthanide', 'Solid', 138.91),
		new Element('Cerium', 58, 'Ce', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 140.12),
		new Element('Praseodymium', 59, 'Pr', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 140.91),
		new Element('Neodymium', 60, 'Nd', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 144.24),
		new Element('Promethium', 61, 'Pm', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 145),
		new Element('Samarium', 62, 'Sm', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 150.4),
		new Element('Europium', 63, 'Eu', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 151.97),
		new Element('Gadolinium', 64, 'Gd', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 157.25),
		new Element('Terbium', 65, 'Tb', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 158.93),
		new Element('Dysprosium', 66, 'Dy', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 162.5),
		new Element('Holmium', 67, 'Ho', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 164.93),
		new Element('Erbium', 68, 'Er', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 167.26),
		new Element('Thulium', 69, 'Tm', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 168.93),
		new Element('Ytterbium', 70, 'Yb', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 173.05),
		new Element('Lutetium', 71, 'Lu', undefined, 6, 'Metal', 'Lanthanide', 'Solid', 174.97),
		new Element('Hafnium', 72, 'Hf', 4, 6, 'Metal', 'Transition', 'Solid', 178.49),
		new Element('Tantalum', 73, 'Ta', 5, 6, 'Metal', 'Transition', 'Solid', 180.95),
		new Element('Tungsten', 74, 'W', 6, 6, 'Metal', 'Transition', 'Solid', 183.84),
		new Element('Rhenium', 75, 'Re', 7, 6, 'Metal', 'Transition', 'Solid', 186.21),
		new Element('Osmium', 76, 'Os', 8, 6, 'Metal', 'Transition', 'Solid', 190.2),
		new Element('Iridium', 77, 'Ir', 9, 6, 'Metal', 'Transition', 'Solid', 192.2),
		new Element('Platinum', 78, 'Pt', 10, 6, 'Metal', 'Transition', 'Solid', 195.08),
		new Element('Gold', 79, 'Au', 11, 6, 'Metal', 'Transition', 'Solid', 196.97),
		new Element('Mercury', 80, 'Hg', 12, 6, 'Metal', 'Transition', 'Liquid', 200.59),
		new Element('Thallium', 81, 'Tl', 13, 6, 'Metal', 'Post-transition', 'Solid', 204.39),
		new Element('Lead', 82, 'Pb', 14, 6, 'Metal', 'Post-transition', 'Solid', 207.2),
		new Element('Bismuth', 83, 'Bi', 15, 6, 'Metal', 'Post-transition', 'Solid', 208.98),
		new Element('Polonium', 84, 'Po', 16, 6, 'Metal', 'Post-transition', 'Solid', 209),
		new Element('Astatine', 85, 'At', 17, 6, 'Metalloid', undefined, 'Solid', 210),
		new Element('Radon', 86, 'Rn', 18, 6, 'Nonmetal', 'Noble gas', 'Gas', 222),
		new Element('Francium', 87, 'Fr', 1, 7, 'Metal', 'Alkali', 'Solid', 223),
		new Element('Radium', 88, 'Ra', 2, 7, 'Metal', 'Alkail earth', 'Solid', 226),
		new Element('Actinium', 89, 'Ac', 3, 7, 'Metal', 'Actinide', 'Solid', 227),
		new Element('Thorium', 90, 'Th', undefined, 7, 'Metal', 'Actinide', 'Solid', 232.04),
		new Element('Protactinium', 91, 'Pa', undefined, 7, 'Metal', 'Actinide', 'Solid', 231.04),
		new Element('Uranium', 92, 'U', undefined, 7, 'Metal', 'Actinide', 'Solid', 238.03),
		new Element('Neptunium', 93, 'Np', undefined, 7, 'Metal', 'Actinide', 'Solid', 237),
		new Element('Plutonium', 94, 'Pu', undefined, 7, 'Metal', 'Actinide', 'Solid', 244),
		new Element('Americium', 95, 'Am', undefined, 7, 'Metal', 'Actinide', 'Solid', 243),
		new Element('Curium', 96, 'Cm', undefined, 7, 'Metal', 'Actinide', 'Solid', 247),
		new Element('Berkelium', 97, 'Bk', undefined, 7, 'Metal', 'Actinide', 'Solid', 247),
		new Element('Californium', 98, 'Cf', undefined, 7, 'Metal', 'Actinide', 'Solid', 251),
		new Element('Einsteinium', 99, 'Es', undefined, 7, 'Metal', 'Actinide', 'Solid', 252),
		new Element('Fermium', 100, 'Fm', undefined, 7, 'Metal', 'Actinide', 'Solid', 257),
		new Element('Mendelevium', 101, 'Md', undefined, 7, 'Metal', 'Actinide', 'Solid', 258),
		new Element('Nobelium', 102, 'No', undefined, 7, 'Metal', 'Actinide', 'Solid', 259),
		new Element('Lawrencium', 103, 'Lr', undefined, 7, 'Metal', 'Actinide', 'Solid', 262),
		new Element('Rutherfordium', 104, 'Rf', 4, 7, 'Metal', 'Transition', 'Unknown', 267),
		new Element('Dubnium', 105, 'Db', 5, 7, 'Metal', 'Transition', 'Unknown', 270),
		new Element('Seaborgium', 106, 'Sg', 6, 7, 'Metal', 'Transition', 'Unknown', 271),
		new Element('Bohrium', 107, 'Bh', 7, 7, 'Metal', 'Transition', 'Unknown', 270),
		new Element('Hassium', 108, 'Hs', 8, 7, 'Metal', 'Transition', 'Unknown', 277),
		new Element('Meitnerium', 109, 'Mt', 9, 7, undefined, undefined, 'Unknown', 276),
		new Element('Darmstadtium', 110, 'Ds', 10, 7, undefined, undefined, 'Unknown', 281),
		new Element('Roentgenium', 111, 'Rg', 11, 7, undefined, undefined, 'Unknown', 282),
		new Element('Copernicium', 112, 'Cn', 12, 7, 'Metal', 'Transition', 'Unknown', 285),
		new Element('Nihonium', 113, 'Nh', 13, 7, undefined, undefined, 'Unknown', 286),
		new Element('Flerovium', 114, 'Fl', 14, 7, 'Metal', 'Post-transition', 'Unknown', 289),
		new Element('Moscovium', 115, 'Mc', 15, 7, undefined, undefined, 'Unknown', 290),
		new Element('Livermorium', 116, 'Lv', 16, 7, undefined, undefined, 'Unknown', 293),
		new Element('Tennessine', 117, 'Ts', 17, 7, undefined, undefined, 'Unknown', 294),
		new Element('Oganesson', 118, 'Og', 18, 7, undefined, undefined, 'Unknown', 294),
	];
	
	constructor(name, atmNum, symbol, group, period, category, subcategory, state, mass) {
		this.name = name; // Hydrogen
		this.atmNum = atmNum; // 1 (atomic number)
		this.symbol = symbol; // H
		this.group = group; // 1 (column)
		this.period = period; // 1 (row)
		this.category = category; // nonmetal
		this.subcategory = subcategory; // other
		this.state = state; // gas (state at STP)
		this.mass = mass; // 1.008 (amu)
	}
	
	// get an element from its name, symbol, or atomic number
	static getElem(input) {
		return Element.elems.find(function(elem) {
			return elem.name.toLowerCase() === input.toLowerCase() || elem.symbol.toLowerCase() === input.toLowerCase() || elem.atmNum == input || (input >= 2 && levenshtein(input, elem.name) <= 3);
		});
	}
	
	// add more stuff ye
	static print() {
		var str = '';
		Element.elems.forEach(function(e) {
			str += `new Element('` + e.name + `', ` + e.atmNum + `, '` + e.symbol + `', ` + e.group + `, ` + e.period + `, '` + e.category + `', '` + e.subcategory + `', '` + e.state + `', ` + e.mass + `),\n`;
		});
		
		console.log(str)
	}
	
	toString() {
		return this.symbol;
	}
}

class Formula {
	constructor(formula) {
		this.formula = formula; // string
	}
	
	// returns an object containing the oxidation of all elements in the formula
	oxidation(expectedCharge, provided) {
		if (expectedCharge === undefined) {
			expectedCharge = 0; // used for ions
		}
		
		var elemCount = this.count();
		var result = {};
		
		var keys = Object.keys(elemCount);
		
		// set base values of result object
		keys.forEach(function(elem) {
			result[elem] = undefined;
		});
		
		// oxidation of free element is 0
		if (keys.length === 1) {
			result[keys[0]] = 0;
			return result;
		}
		
		var chargeSum = 0;
		
		var self = this; // to be used in keys
		// more than one element
		keys.forEach(function(elem) {
			elem = Element.getElem(elem);
			
			if (elem.group <= 2 && elem.period > 1) { // oxidation of alkali metals and alkali earth metals are 1 or 2
				result[elem] = elem.group;
			} else if (elem.name === 'Fluorine') { // it's -1
				result[elem] = -1;
			} else if (elem.name === 'Hydrogen') { // +1, however -1 in metal hydrides
				if (self.metalHydride()) {
					result[elem] = -1;
				} else {
					result[elem] = 1;
				}
			} else if (elem.name === 'Oxygen') { // -2, however -1 in peroxides
				if (self.peroxide()) {
					result[elem] = -1;
				} else {
					result[elem] = -2;
				}
			}
			
			if (result[elem] !== undefined) {
				chargeSum += result[elem] * elemCount[elem];
			}
		});
		
		// if there's a key with an undefined value, calculate it; but if this value is 0, it's invalid
		var undefKey = keys.find(function(key) {
			return result[Element.getElem(key)] === undefined;
		});
		
		if (undefKey !== undefined) {
			if ((expectedCharge - chargeSum) / elemCount[undefKey] === 0) {
				throw new Error('Oxidation failed again');
			}
			
			result[undefKey] = (expectedCharge - chargeSum) / elemCount[undefKey];
		}
		
		return result;
	}
	
	// returns true if the formula represents a metal hydride (metal + hydride)
	metalHydride() {
		var elems = this.elements();
		
		if (elems.length === 2 && this.hasMetal() && this.hasElement('Hydrogen')) {
			return true;
		}
		
		return false;
	}
	
	// returns true if the formula represents a peroxide (group 1, group 2, hydrogen + oxygen)
	peroxide() {
		var elems = this.elements();
		
		if (elems.length === 2 && this.hasGroup(1, 2) && this.hasElement('Oxygen')) {
			return true;
		}
		
		return false;
	}
	
	// returns true if the formula contains elements with any of the provided groups
	hasGroup(...groups) {
		var elems = this.elements();
		
		for (var i = 0; i < elems.length; ++i) {
			if (groups.includes(elems[i].group)) {
				return true;
			}
		}
		
		return false;
	}
	
	// returns true if the formula contains a metal
	hasMetal() {
		var elems = this.elements();
		
		for (var i = 0; i < elems.length; ++i) {
			if (elems[i].category === 'Metal') {
				return true;
			}
		}
		
		return false;
	}
	
	// returns true if the formula contains a nonmetal
	hasNonMetal() {
		var elems = this.elements();
		
		for (var i = 0; i < elems.length; ++i) {
			if (elems[i].category === 'Nonmetal') {
				return true;
			}
		}
		
		return false;
	}
	
	// returns true if the formula contains a specified element
	hasElement(element) {
		var elems = this.elements();
		
		for (var i = 0; i < elems.length; ++i) {
			if (Element.getElem(elems[i].name) !== undefined) {
				return true;
			}
		}
		
		return false;
	}
	
	// returns an expression representing a compound's mass
	massExp() {
		// add subscript of 1 to elements without any subscript
		var exp = this.formula.replace(/([A-Z][a-z]?)(\d*)/g, function(match, symbol, num) {
			if (Number(num) >= 1) {
				return symbol + num;
			} else {
				return symbol + '1';
			}
		});
		
		// insert plus sign between elements
		while (/([A-Z][a-z]?\d+)([A-Z][a-z]?\d+)/g.test(exp)) {
			exp = exp.replace(/([A-Z][a-z]?\d+)([A-Z][a-z]?\d+)/g, function(match, elem1, elem2) {
				return elem1 + '+' + elem2;
			});
		}
		
		// insert plus sign between elements and a nested element group
		exp = exp.replace(/([A-Z][a-z]?\d+)(\(.+\)\d+)/g, function(match, elem, group) {
			return elem + '+' + group;
		});
		
		exp = exp.replace(/(\(.+\)\d+)([A-Z][a-z]?\d+)/g, function(match, group, elem) {
			return group + '+' + elem;
		});
		
		// insert multiplication sign between subscript and nested element group
		exp = exp.replace(/(\(.+\))(\d+)/g, function(match, group, subscript) {
			return group + '*' + subscript;
		});
		
		// replace elements with their mass multiplied by the subscript
		exp = exp.replace(/([A-Z][a-z]?)(\d+)/g, function(match, symbol, num) {
			var mass = Element.elems.find(function(elem) {
				return elem.symbol === symbol;
			}).mass * num;
			
			return mass;
		});
		
		// result
		return exp;
	}
	
	mass() {
		return eval(this.massExp());
	}
	
	// returns an object containing all the elements and their amounts in a formula
	count() {
		// add subscript of 1 to elements without any subscript
		var exp = this.formula.replace(/([A-Z][a-z]?)(\d*)/g, function(match, symbol, num) {
			if (Number(num) >= 1) {
				return symbol + num;
			} else {
				return symbol + '1';
			}
		});
		
		// distribute subscript of nested element group into group
		exp = exp.replace(/\((.+)\)(\d+)/g, function(match, inParen, multiplier) {
			var elemsInParen = [...inParen.matchAll(/([A-Z][a-z]?)(\d+)/g)];
			var str = '';
			
			elemsInParen.forEach(function(arr) {
				arr[2] = Number(arr[2]) * multiplier;
				str += arr[1] + arr[2];
			});
			
			return str;
		});
		
		var elems = [...exp.matchAll(/([A-Z][a-z]?)(\d+)/g)];
		var count = {};
		
		elems.forEach(function(arr) {
			count[Element.getElem(arr[1])] = Number(arr[2]);
		});
		
		return count;
	}
	
	// returns an object containing all the elements in a formula
	elements() {
		var elems = Object.keys(this.count());
		
		elems.forEach(function(elem, index) {
			elems[index] = Element.getElem(elem);
		});
		
		return elems;
	}
}

module.exports = {
	Formula: Formula,
	Element: Element,
};