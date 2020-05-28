// the game module; every game in mathbot will be programmed here

// pick a random integer from min to max
var randInt = function(min, max) {
	if (max === undefined) { // 0 to max
		return Math.floor(Math.random() * Math.floor(min));
	} else { // min to max
		return Math.floor(Math.random() * Math.floor(max - min)) + min;
	}
};

Array.prototype.indexOfEK = function(name) {
	for (var i = 0; i < this.length; ++i) {
		if (this[i].name === name) {
			return i;
		}
	}
	
	return -1;
};

// returns the amount of times an element occurs in an array
var occurs = function(arr, func) {
	return arr.filter(func).length;
};

// implementation of a 2d array
class Array2 {
	constructor(lX, lY) { // lengths of array on x and y dimension
		this._map = new Array(lY);
		
		for (var i = 0; i < lY; ++i) {
			this._map[i] = new Array(lX);
		}
		
		this.lX = lX;
		this.lY = lY;
	}
	
	// amount of elements that are defined
	get size() {
		var count = 0;
		
		for (var i = 0; i < this.lX; ++i) {
			for (var j = 0; j < this.lY; ++j) {
				if (this._map[j][i] !== undefined) {
					++count;
				}
			}
		}
		
		return count;
	}
	
	// get element at (x, y)
	get(x, y) {
		return this._map[y][x];
	}
	
	// set element at (x, y) with the value 'v'
	set(x, y, v) {
		this._map[y][x] = v;
	}
	
	// fill all elements with 'v'
	fill(v) {
		for (var i = 0; i < this.lX; ++i) {
			for (var j = 0; j < this.lY; ++j) {
				this._map[j][i] = v;
			}
		}
	}
	
	toString() {
		var str = '';
		
		for (var j = 0; j < this.lY; ++j) {
			for (var i = 0; i < this.lX; ++i) {
				str += this._map[j][i] === undefined ? '.' : 'F';
			}
			
			if (j !== this.lY - 1) {
				str += '\n';
			}
		}
		
		return str;
	}
}

// represents a game, singleplayer, multiplayer, whatever
/*class Game {
	constructor(host, players, spectators, inProgress) {
		this.host = host; // the user who made the game
		this.players = players; // players in this game, includes the host
		this.spectators = spectators; // anyone who is spectating the game, must not be in this.players; when spectating, they receive DMs of the overall game from MathBot
		this.inProgress = inProgress; // true if the game is still running
	}
	
	// given a room object, return an instance of a game depending on players and the game
	static gameInstance(room) {
		if (room.game === 'Battleship') {
			return new Battleship();
		} else if (room.game === 'Exploding Kittens') {
			return new ExplodingKittens(room.players, room.spectators);
		}
	}
	
	// is this lobby ready to party; returns true if set up, returns a reason why if not set up
	static lobbyReady(room) {
		if (room.game === 'Exploding Kittens') {
			if (room.players.length >= 2 && room.players.length <= 10) {
				return true;
			} else {
				return '**This game only supports 2 to 10 players.**';
			}
		}
	}
}

// the classic 1 vs 1 board game, strategy-esque, guess a lot
class Battleship extends Game {
	constructor(p1, p2) { // the user ids of the two players
		this.round = 1;
		this.turn = 0; // 0 = player 1's turn, 1 = player 2's turn
		
		this.p1 = new BattleshipAgent(p1);
		this.p2 = new BattleshipAgent(p2);
	}
}

// a player in the battleship game
class BattleshipAgent {
	constructor(id) {
		this.id = id;
		
		this.ships = new Array2(10, 10);
	}
}*/




// represents a card in Exploding Kittens
class ExplodingKittensCard {
	constructor(name, paw, cat, player) {
		this.name = name;
		this.paw = paw; // true if there is a paw on it, false if not (for dividing cards as described in the rulebook)
		this.cat = cat; // true if this card is the one that must be played in pairs
		this.player = player; // the player that played this card
	}
	
	// Action or Cat
	get type() {
		if (this.cat) {
			return 'Cat';
		} else if (this.name !== 'Exploding Kitten') {
			return 'Action';
		} else {
			return undefined;
		}
	}
	
	toString() {
		if (this.name === 'Exploding Kitten') {
			return this.name;
		}
		
		return this.name + ' - ' + this.type;
	}
}

// represents an instance of the Exploding Kittens card game: https://explodingkittens.com/how-to-play/exploding-kittens-party-pack
// the version of exploding kittens programmed here is the Party Pack edition with 120 cards, good for 2 to 10 players
class ExplodingKittens {
	constructor(players, spectators) { // array of players' ids in the game
		// generate the deck
		var cards = [];
		for (var i = 0; i < 135; ++i) {
			if (i < 9) {
				if (i === players.length - 1) { // only add players - 1 amount of exploding kittens to ensure there is 1 victor
					i = 8;
					continue;
				}
				
				cards.push(new ExplodingKittensCard('Exploding Kitten', false, false));
			} else if (i < 12) {
				cards.push(new ExplodingKittensCard('Defuse', true, false));
			} else if (i < 19) {
				cards.push(new ExplodingKittensCard('Defuse', false, false));
			} else if (i < 23) {
				cards.push(new ExplodingKittensCard('Attack', true, false));
			} else if (i < 30) {
				cards.push(new ExplodingKittensCard('Attack', false, false));
			} else if (i < 34) {
				cards.push(new ExplodingKittensCard('Skip', true, false));
			} else if (i < 40) {
				cards.push(new ExplodingKittensCard('Skip', false, false));
			} else if (i < 43) {
				cards.push(new ExplodingKittensCard('See the Future', true, false));
			} else if (i < 46) {
				cards.push(new ExplodingKittensCard('See the Future', false, false));
			} else if (i < 48) {
				cards.push(new ExplodingKittensCard('Alter the Future', true, false));
			} else if (i < 52) {
				cards.push(new ExplodingKittensCard('Alter the Future', false, false));
			} else if (i < 54) {
				cards.push(new ExplodingKittensCard('Shuffle', true, false));
			} else if (i < 58) {
				cards.push(new ExplodingKittensCard('Shuffle', false, false));
			} else if (i < 61) {
				cards.push(new ExplodingKittensCard('Draw from the Bottom', true, false));
			} else if (i < 65) {
				cards.push(new ExplodingKittensCard('Draw from the Bottom', false, false));
			} else if (i < 67) {
				cards.push(new ExplodingKittensCard('Favor', true, false));
			} else if (i < 71) {
				cards.push(new ExplodingKittensCard('Favor', false, false));
			} else if (i < 75) {
				cards.push(new ExplodingKittensCard('Nope', true, false));
			} else if (i < 81) {
				cards.push(new ExplodingKittensCard('Nope', false, false));
			} else if (i < 83) {
				cards.push(new ExplodingKittensCard('Feral Cat', true, true));
			} else if (i < 87) {
				cards.push(new ExplodingKittensCard('Feral Cat', false, true));
			} else if (i < 90) {
				cards.push(new ExplodingKittensCard('Tacocat', true, true));
			} else if (i < 94) {
				cards.push(new ExplodingKittensCard('Tacocat', false, true));
			} else if (i < 97) {
				cards.push(new ExplodingKittensCard('Cattermelon', true, true));
			} else if (i < 101) {
				cards.push(new ExplodingKittensCard('Cattermelon', false, true));
			} else if (i < 104) {
				cards.push(new ExplodingKittensCard('Hairy Potato Cat', true, true));
			} else if (i < 108) {
				cards.push(new ExplodingKittensCard('Hairy Potato Cat', false, true));
			} else if (i < 111) {
				cards.push(new ExplodingKittensCard('Beard Cat', true, true));
			} else if (i < 115) {
				cards.push(new ExplodingKittensCard('Beard Cat', false, true));
			} else if (i < 118) {
				cards.push(new ExplodingKittensCard('Rainbow-Ralphing Cat', true, true));
			} else if (i < 122) {
				cards.push(new ExplodingKittensCard('Rainbow-Ralphing Cat', false, true));
			} else if (i < 125) {
				cards.push(new ExplodingKittensCard('Double Slap', true, false));
			} else if (i < 129) {
				cards.push(new ExplodingKittensCard('Double Slap', false, false));
			} else if (i < 130) {
				cards.push(new ExplodingKittensCard('Triple Slap', true, false));
			} else if (i < 131) {
				cards.push(new ExplodingKittensCard('Triple Slap', false, false));
			} else if (i < 135) {
				cards.push(new ExplodingKittensCard('Reverse', false, false));
			}
		}
		
		// TODO removes the slap cards because they don't work at the moment
		cards = cards.filter(function(card) {
			return card.name !== 'Double Slap' && card.name !== 'Triple Slap';
		});
		
		// remove cards based on how many players there are
		if (players.length >= 2 && players.length <= 3) { // only use Exploding Kitten or cards with paw (57)
			cards = cards.filter(function(card) {
				return card.name === 'Exploding Kitten' || card.paw;
			});
		} else if (players.length >= 4 && players.length <= 7) { // only use Exploding Kitten or cards without paw (87)
			cards = cards.filter(function(card) {
				return card.name === 'Exploding Kitten' || !card.paw;
			});
		} // otherwise, use everything (135)
		
		// begin distributing cards to players
		var hands = {};
		for (var i = 0; i < players.length; ++i) {
			var id = players[i];
			
			if (hands[id] === undefined) {
				hands[id] = [];
			}
			
			// give everyone a defuse card
			var firstDefuse = cards.indexOfEK('Defuse');
			
			cards[firstDefuse].player = id;
			hands[id].push(cards[firstDefuse]);
			cards.splice(firstDefuse, 1);
		}
		
		for (var i = 0; i < players.length; ++i) {
			var id = players[i];
			
			// give everyone 7 random cards (that aren't exploding kittens), so afterwards, everyone has 8 cards in total
			for (var j = 0; j < 7; ++j) {
				var nextIndex = randInt(cards.length);
				
				while (cards[nextIndex].name === 'Exploding Kitten') {
					nextIndex = randInt(cards.length);
				}
				
				cards[nextIndex].player = id;
				hands[id].push(cards[nextIndex]);
				cards.splice(nextIndex, 1);
			}
		}
		
		// assign game variables
		this.draw = cards; // represents the draw pile; the top cards will be at the beginning of the array (drawPile[0]); this is the remaining cards after cards have been distributed to players
		this.discard = []; // represents the discard pile; cards that are played will be moved here (discard[0] is the top of the discard pile)
		this.playerHands = hands; // assigns players their hand
		
		this.playerOrder = Object.keys(this.playerHands); // playerOrder[0] is first (array of user ids)
		this.current = 0; // current player's index in playerOrder
		
		this.count = this.playerOrder.length; // amount of players
		this.state = 0; // -1: not ready, 0: normal play, 1: altering the future, 2: selecting a favor, 3: giving a favor, 4: reinserting an exploding kitten (after using defuse), 5: two of a kind combo was played
		
		this.players = players;
		this.spectators = spectators;
		
		// special variables to keep track of certain outcomes during the game
		this.attackState = 0; // value increases when a player plays an attack, which is used to keep track of how many turns someone has to play, etc.
		this.favor = undefined; // the id of the player who is giving a favor
		
		this.endTurn = false; // if true, bot.js will handle ending the turn for everyone
		this.victor = undefined; // if defined, bot.js will handle telling everyone the winner
		
		this.shuffle();
	}
	
	// id of the current player
	get currentID() {
		return this.playerOrder[this.current];
	}
	
	// draws a random card from this.draw, unless if an index is provided
	next(index) {
		if (index === undefined) {
			return this.draw.splice(randInt(this.draw.length), 1)[0];
		} else {
			return this.draw.splice(index, 1)[0];
		}
	}
	
	// shuffles this.draw
	shuffle() {
		for (var i = this.draw.length - 1; i > 0; --i) {
			var j = Math.floor(Math.random() * (i + 1));
			[this.draw[i], this.draw[j]] = [this.draw[j], this.draw[i]]; // array destructuring syntax
		}
	}
	
	// prints the hand of the player with the id 'id', prefixing each card with 'prefix'
	printHand(id, prefix, showIndex) {
		var hand = '';
		
		this.playerHands[id].forEach(function(card, index) {
			hand += prefix + (showIndex ? index + ': ' : '') + card + '\n';
		});
		
		return hand;
	}
	
	// returns a string that represents how the game interface should look for the current player
	printTurn() {
		// start with amount of cards left in this.draw
		var str = this.draw.length + (this.draw.length === 1 ? ' card ' : ' cards ') + 'remaining in draw pile\n';
		
		// show player's hand
		str += 'Your hand:\n' + this.printHand(this.playerOrder[this.current], '	', true);
		
		// instructions for playing a card
		str += '\n**Play** cards by typing the **number** next to the cards you\'d like to play.\n**End** your turn by typing `draw` to draw a card and move to the next player.\n**View** the **discard pile** by typing `discard`.';
		
		return str;
	}
	
	// returns a list of players who are alive (the same as below)
	returnPlayers(exclude) {
		var pHTemp = this.playerHands;
		
		return this.playerOrder.filter(function(id) {
			return !exclude.includes(id) && pHTemp[id] !== undefined;
		});
	}
	
	// returns a string with all the players who are alive
	printPlayers(exclude, prefix, showIndex) {
		var pHTemp = this.playerHands;
		var str = '';
		
		this.returnPlayers(exclude).forEach(function(id, index) {
			if (!exclude.includes(id) && pHTemp[id] !== undefined) {
				str += prefix + (showIndex ? index + ': ' : '') + id + '\n';
			}
		});
		
		return str;
	}
	
	// returns a string of the next three draw cards
	nextThree(prefix, showIndex) {
		var str = '';
		
		for (var i = 0; i < (this.draw.length >= 3 ? 3 : this.draw.length); ++i) {
			str += prefix + (showIndex ? (i + 1) + ': ' : '') + this.draw[i] + '\n';;
		}
		
		return str;
	}
	
	// returns a string of the next 10 discard cards
	showDiscards(prefix, showIndex) {
		var str = '';
		
		for (var i = 0; i < (this.discard.length >= 10 ? 10 : this.discard.length); ++i) {
			str += prefix + (showIndex ? (i + 1) + ': ' : '') + this.discard[i] + ' (' + this.discard[i].player + ')\n';;
		}
		
		return str;
	}
	
	// returns true if this input of numbers is valid (has numbers 1, 2, 3 in string form)
	validATF(input) {
		var sort = input.slice().sort(function(num1, num2) {
			return num1 - num2;
		});
		
		for (var i = 0; i < 3; ++i) {
			if (sort[i] != (i + 1)) {
				return false;
			}
		}
		
		return true;
	}
	
	// increments the attackState correctly
	incrAttack(direction) {
		if (direction === 'up') {
			if (this.attackState === 0) {
				++this.attackState;
			} else {
				this.attackState += 2;
			}
		} else if (direction === 'down') {
			if (this.attackState === 1) {
				--this.attackState;
			} else {
				this.attackState -= 2;
			}
		}
	}
	
	// changes all values signifying the ending of the current player's turn
	previousPlayer() {
		--this.current;
		if (this.current <= -1) {
			this.current = this.count - 1;
		}
		
		this.endTurn = true;
		
		// skip dead players
		if (this.playerHands[this.playerOrder[this.current]] === undefined) {
			this.previousPlayer();
		}
	}
	
	// changes all values signifying the ending of the current player's turn
	nextPlayer() {
		++this.current;
		if (this.current >= this.count) {
			this.current = 0;
		}
		
		this.endTurn = true;
		
		// skip dead players
		if (this.playerHands[this.playerOrder[this.current]] === undefined) {
			this.nextPlayer();
		}
	}
	
	// calculates an input that can be pased to input() for a user (bots, auto-play, etc.)
	inputForMe(userID) {
		if (this.state === 0) {
			
		}
	}
	
	// a user sent a message to MathBot, evaluate it and see if it is valid; return reply strings if it is and do some actions
	input(userID, message) {
		this.endTurn = false;
		var str = {}; // an object of messages that each player will receive; the 'else' tag signifies a message that all other players that aren't mentioned will receive
		
		var drawn = undefined; // the card that was drawn, if any
		var currentlyAlive = this.returnPlayers([userID]); // the list of players who are still alive, excluding the sender of the message
		
		parse: {
			if (this.state === 0) { // normal play
				// respond only if the user is the current player or they typed 'help' TODO
				if (userID === this.playerOrder[this.current]) {
					// message contains numbers; probably playing their cards, so determine those cards
					var plays = [...message.matchAll(/\d+/g)];
					
					// remove duplicate matches (to deal with abusing the special combos)
					plays = plays.filter(function(num, index) {
						return plays.indexOf(num) === index;
					});
					
					for (var i = 0; i < plays.length; ++i) {
						plays[i] = this.playerHands[userID][plays[i]]; // get cards from the numbers
						
						// if there are any undefined cards, that's an invalid input
						if (plays[i] === undefined) {
							str[userID] = '**That\'s not a valid play! Make sure you have those cards and type `help` if you need it.**';
							break parse;
						}
						
						plays[i].player = userID;
					}
					
					console.log('played:');
					console.log(plays);
					
					// valid play; check occasions for 1 card played, 2 cards played, 3 cards played, 5 cards played, or 'draw,' the last one signifying the end of the player's turn
					// 1 card played
					if (plays.length === 1) { // TODO handle attack and skip and moving to the next turn
						// this card should never be a defuse; the defuse is automatically played if the user draws an exploding kitten
						if (plays[0].name === 'Defuse') {
							str[userID] = '**Your Defuse card will automatically be played if you draw an Exploding Kitten.**';
							break parse;
						} else if (plays[0].name === 'Attack') { // end the player's turn and move to the next player, who will have to play twice
							this.nextPlayer();
							this.incrAttack('up');
							
							this.discard.unshift(plays[0]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Attack'), 1);
							
							str[userID] = '**You\'ve played Attack! It is now ' + this.playerOrder[this.current] + '\'s turn, who will have to play two more turns.**';
							str['else'] = '**' + userID + ' played Attack! It is now ' + this.playerOrder[this.current] + '\'s turn, who will have to play two more turns.**';
							str['spectate'] = this.playerOrder[this.current] + '\'s hand:\n' + this.printHand(this.playerOrder[this.current], '\t', false);
							
							break parse;
						} else if (plays[0].name === 'Skip') { // player's turn ends and they don't draw
							this.discard.unshift(plays[0]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Skip'), 1);
							
							if (this.attackState > 0) { // player must skip twice to beat an attack card played on them
								this.incrAttack('down');
								
								str[userID] = '**You\'ve played Skip! However, you still need to complete ' + (this.attackState + 1) + ' Attack' + (this.attackState + 1 === 1 ? '' : 's') + ', so it is your turn again.**\n' + this.printTurn();
								str['else'] = '**' + userID + ' played Skip! However, they still need to complete ' + (this.attackState + 1) + ' Attack' + (this.attackState + 1 === 1 ? '' : 's') + ', so it is their turn again.**';
								str['spectate'] = userID + '\'s hand:\n' + this.printHand(userID, '\t', false);
							} else {
								this.nextPlayer();
								
								str[userID] = '**You\'ve played Skip! It is now ' + this.playerOrder[this.current] + '\'s turn.**';
								str['else'] = '**' + userID + ' played Skip! It is now ' + this.playerOrder[this.current] + '\'s turn.**';
								str['spectate'] = this.playerOrder[this.current] + '\'s hand:\n' + this.printHand(this.playerOrder[this.current], '\t', false);
							}
							
							break parse;
						} else if (plays[0].name === 'See the Future') { // view the next three cards
							this.discard.unshift(plays[0]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('See the Future'), 1);
							
							str[userID] = '**You\'ve played See the Future! The next three cards on the draw pile are:** _(1 - top card)_\n' + this.nextThree('\t', true) + '\n' + this.printTurn();
							str['else'] = '**' + userID + ' played See the Future! They now know the next three cards on the draw pile.**';
							str['spectate'] = 'Next three draw cards:\n' + this.nextThree('\t', true) + '\n' + userID + '\'s hand:\n' + this.printHand(userID, '\t', false);
							
							break parse;
						} else if (plays[0].name === 'Alter the Future') { // view and rearrange the next three cards
							this.discard.unshift(plays[0]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Alter the Future'), 1);
							
							str[userID] = '**You\'ve played Alter the Future! The next three cards on the draw pile are:** _(1 - top card)_\n' + this.nextThree('\t', true) + '\n**Rearrange** the cards in an order of your choosing by typing the **numbers** next to each card. The cards will be arranged from **top to bottom**. For example, to keep the cards in the same order, type `1 2 3`.';
							str['else'] = '**' + userID + ' played Alter the Future! They can now alter the positions of the next three draw cards.**';
							str['spectate'] = 'Next three draw cards:\n' + this.nextThree('\t', true);
							
							this.state = 1;
							
							break parse;
						} else if (plays[0].name === 'Shuffle') { // shuffles the deck
							this.shuffle();
							
							this.discard.unshift(plays[0]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Shuffle'), 1);
							
							str[userID] = '**You\'ve played Shuffle! The draw pile has now been shuffled completely.**\n\n' + this.printTurn();
							str['else'] = '**' + userID + ' played Shuffle! The draw pile has now been shuffled completely.**';
							str['spectate'] = userID + '\'s hand:\n' + this.printHand(userID, '\t', false);
							
							break parse;
						} else if (plays[0].name === 'Draw from the Bottom') { // turn ends and player draws from the bottom instead of top
							drawn = this.next(this.draw.length - 1);
							drawn.player = userID;
							
							this.discard.unshift(plays[0]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Draw from the Bottom'), 1);
							this.playerHands[userID].push(drawn);
							
							if (this.attackState > 0) {
								//--this.attackState;
								this.incrAttack('down');
								
								str[userID] = '**You\'ve played Draw from the Bottom! You\'ve drawn from the bottom of the draw pile, however you still need to complete ' + (this.attackState + 1) + ' Attack' + (this.attackState + 1 === 1 ? '' : 's') + ', so it is your turn again.**\nYou drew:\n\t' + drawn + '\n\n' + this.printTurn();
								str['else'] = '**' + userID + ' played Draw from the Bottom! They have drawn from the bottom of the draw pile, however they still need to complete ' + (this.attackState + 1) + ' Attack' + (this.attackState + 1 === 1 ? '' : 's') + ', so it is their turn again.**';
								str['spectate'] = userID + ' drew:\n\t' + drawn + '\n\n' + userID + '\'s hand:\n' + this.printHand(userID, '\t', false);
							} else {
								if (drawn.name !== 'Exploding Kitten') {
									this.nextPlayer();
								}
								
								str[userID] = '**You\'ve played Draw from the Bottom! You\'ve drawn from the bottom of the draw pile, and it is now ' + this.playerOrder[this.current] + '\'s turn.**\nYou drew:\n\t' + drawn;
								str['else'] = '**' + userID + ' played Draw from the Bottom! They have drawn from the bottom of the draw pile, and it is now ' + this.playerOrder[this.current] + '\'s turn.**';
								str['spectate'] = userID + ' drew:\n\t' + drawn + '\n\n' + this.playerOrder[this.current] + '\'s hand:\n' + this.printHand(this.playerOrder[this.current], '\t', false);
							}
							
							break parse;
						} else if (plays[0].name === 'Favor') { // force another player to give any card to the player
							this.discard.unshift(plays[0]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Favor'), 1);
							
							str[userID] = '**You\'ve played Favor! Select a player to give you a card (of their choosing) by typing the number next to their name:**\n' + this.printPlayers([userID], '\t', true);
							str['else'] = '**' + userID + ' played Favor! They can now select any other player to give them a card.**';
							
							this.state = 2;
							
							break parse;
						} else if (plays[0].name === 'Nope') {
							// check if nope can be played
							if (this.discard.length === 0) {
								str[userID] = '**There is nothing to use Nope on!**';
								break parse;
							} else if (this.discard[0].player === userID) {
								str[userID] = '**You can\'t use Nope on yourself!**';
								break parse;
							} else {
								if (this.discard[0].name === 'Defuse') { // first discard is a defuse, which cannot be noped
									str[userID] = '**You cannot Nope a Defuse card.**';
									break parse;
								} else if (this.discard[0].name === 'Attack') {
									// go back to the previous player and decrement this.attackState;
									this.previousPlayer();
									//--this.attackState;
									this.incrAttack('down');
								} else if (this.discard[0].name === 'Skip') {
									// go back to the previous player
									this.previousPlayer();
								} else if (this.discard[0].name === 'See the Future') {
									str[userID] = '**You cannot Nope a See the Future card.**';
									break parse;
								} else if (this.discard[0].name === 'Alter the Future') {
									str[userID] = '**You cannot Nope an Alter the Future card.**';
									break parse;
								} else if (this.discard[0].name === 'Shuffle') {
									str[userID] = '**You cannot Nope a Shuffle card.**';
									break parse;
								} else if (this.discard[0].name === 'Draw from the Bottom') {
									str[userID] = '**You cannot Nope a Draw from the Bottom card.**';
									break parse;
								} else if (this.discard[0].name === 'Favor') {
									str[userID] = '**You cannot Nope a Favor card.**';
									break parse;
								} else if (this.discard[0].name === 'Nope') { // TODO you should be able to nope most of these
									str[userID] = '**I am still figuring this out.**';
									break parse;
								}
								
								str[userID] = '**You\'ve played Nope, negating the ' + this.discard[0].name +' played by ' + this.discard[0].player + '! It is now ' + this.discard[0].player + '\'s turn.**';
								str['else'] = '**' + userID + ' played Nope, negating the ' + this.discard[0].name +' played by ' + this.discard[0].player + '! It is now ' + this.discard[0].player + '\'s turn.**';
								str['spectate'] = this.discard[0].player + '\'s hand:\n' + this.printHand(this.discard[0].player, '\t', false);
								
								this.discard.unshift(plays[0]);
								this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Nope'), 1);
							}
							
							break parse;
						} else if (plays[0].name === 'Reverse') {
							// reverse the player order and redo this.current
							this.playerOrder.reverse();
							this.current = this.playerOrder.indexOf(userID);
							
							this.discard.unshift(plays[0]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Reverse'), 1);
							
							if (this.attackState > 0) {
								//--this.attackState;
								this.incrAttack('down');
								
								str[userID] = '**You\'ve played Reverse! The player order has been reversed; however, you still need to complete ' + (this.attackState + 1) + ' Attack' + (this.attackState + 1 === 1 ? '' : 's') + ', so it is your turn again.**\n' + this.printTurn();
								str['else'] = '**' + userID + ' played Reverse! The player order has been reversed; however, they still need to complete ' + (this.attackState + 1) + ' Attack' + (this.attackState + 1 === 1 ? '' : 's') + ', so it is their turn again.**';
								str['spectate'] = userID + '\'s hand:\n' + this.printHand(userID, '\t', false);
							} else {
								this.nextPlayer();
								
								str[userID] = '**You\'ve played Reverse! The player order has been reversed, so it is now ' + this.playerOrder[this.current] + '\'s turn.**';
								str['else'] = '**' + userID + ' played Reverse! The player order has been reversed, so it is now ' + this.playerOrder[this.current] + '\'s turn.**';
								str['spectate'] = this.playerOrder[this.current] + '\'s hand:\n' + this.printHand(this.playerOrder[this.current], '\t', false);
							}
							
							break parse;
						} else if (plays[0].cat) {
							str[userID] = '**You must play two of this Cat card in order for it to take effect. If you have one, you can use a Feral Cat card, which functions as a wild Cat card.**';
							break parse;
						}
					} else if (plays.length === 2) { // two cards played, expecting cat cards
						if (plays[0].cat && plays[1].cat && (plays[0].name === plays[1].name || plays[0].name === 'Feral Cat' || plays[1].name === 'Feral Cat')) {
							this.discard.unshift(plays[0], plays[1]);
							this.playerHands[userID].splice(this.playerHands[userID].indexOf(plays[0]), 1);
							this.playerHands[userID].splice(this.playerHands[userID].indexOf(plays[1]), 1);
							
							str[userID] = '**You\'ve played a Two of a Kind Combo! Pick a player to steal a random card from them by typing the number next to their name:**\n' + this.printPlayers([userID], '\t', true);
							str['else'] = '**' + userID + ' played a Two of a Kind Combo! They can now select any other player to steal a random card from.**';
							
							this.state = 5;
							
							break parse;
						} else {
							str[userID] = '**You need two of the same Cat card to play a Two of a Kind Combo.**';
							break parse;
						}
					} else if (message.toLowerCase() === 'draw') { // end the user's turn
						drawn = this.next(0);
						drawn.player = userID;
						
						this.playerHands[userID].push(drawn);
						
						if (this.attackState > 0) {
							//--this.attackState;
							this.incrAttack('down');
							
							str[userID] = '**You\'ve drawn a card; however, you still need to complete ' + (this.attackState + 1) + ' Attack' + (this.attackState + 1 === 1 ? '' : 's') + ', so it is your turn again.**\nYou drew:\n\t' + drawn + '\n\n' + this.printTurn();
							str['else'] = '**' + userID + ' has drawn a card; however, they still need to complete ' + (this.attackState + 1) + ' Attack' + (this.attackState + 1 === 1 ? '' : 's') + ', so it is their turn again.**';
							str['spectate'] = userID + ' drew:\n\t' + drawn + '\n\n' + userID + '\'s hand:\n' + this.printHand(userID, '\t', false);
						} else {
							if (drawn.name !== 'Exploding Kitten') {
								this.nextPlayer();
							}
							
							str[userID] = '**You\'ve drawn and ended your turn! It is now ' + this.playerOrder[this.current] + '\'s turn.**\nYou drew:\n\t' + drawn;
							str['else'] = '**' + userID + ' has drawn and ended their turn! It is now ' + this.playerOrder[this.current] + '\'s turn.**';
							str['spectate'] = userID + ' drew:\n\t' + drawn + '\n\n' + this.playerOrder[this.current] + '\'s hand:\n' + this.printHand(this.playerOrder[this.current], '\t', false);
						}
					} else if (message.toLowerCase() === 'discard') { // show discards
						str[userID] = '**The top 10 cards on the discard pile are:** _(1 - top card)_\n' + this.showDiscards('\t', true) + '\n' + this.printTurn();
						break parse;
					}
				}
			} else if (this.state === 1) { // altering the future
				if (userID === this.playerOrder[this.current]) {
					// extract the three numbers from the user's message
					var plays = [...message.matchAll(/\d+/g)];
					
					plays.forEach(function(arr, index) {
						plays[index] = Number(arr[0]);
					});
					
					// make sure all numbers are unique and are 1, 2, or 3
					if (this.validATF(plays)) {
						// rearrange the cards as inputted
						// remove the first three cards from this.draw
						var firstThree = this.draw.splice(0, 3);
						
						// reinsert the cards back into this.draw based on the inputs
						for (var i = 2; i > -1; --i) {
							this.draw.unshift(firstThree[plays[i] - 1]);
						}
						
						str[userID] = '**You\'ve rearranged the draw pile! The top three cards are now:** _(1 - top card)_\n' + this.nextThree('\t', true) + '\n' + this.printTurn();
						str['else'] = '**' + userID + ' has finished rearranging the pile.**';
						str['spectate'] = 'New rearrangement:\n' + this.nextThree('\t', true) + '\n' + userID + '\'s hand:\n' + this.printHand(userID, '\t', false);
						
						this.state = 0;
						
						break parse;
					} else {
						str[userID] = '**That isn\'t a valid ordering! Make sure the numbers 1, 2, and 3 only are in your message.**'
						break parse;
					}
				}
			} else if (this.state === 2) { // selecting a favor
				if (userID === this.playerOrder[this.current]) {
					// get the number that the user entered
					var selection = undefined;
					
					if (/\d+/g.test(message)) {
						selection = message.match(/\d+/g)[0];
					} else {
						str[userID] = '**You didn\'t select a player! Select a player by typing the number next to their name.**';
						break parse;
					}
					
					// invalid player if they are dead
					if (currentlyAlive[selection] === undefined) {
						str[userID] = '**That\'s not a valid player! Make sure you\'ve entered the correct number of the player on the list above.**';
						break parse;
					}
					
					var selectedID = currentlyAlive[selection];
					
					// change state and message the selected player for the favor
					str[userID] = '**You\'ve delegated your favor to ' + selectedID + '! They will give you a card of their choosing.**';
					str[selectedID] = '**' + userID + ' has chosen to take a card from you! Pick any card from your hand to give by typing the number next to the card:**\n' + this.printHand(selectedID, '\t', true);
					str['else'] = '**' + userID + ' has chosen to take ' + selectedID + '\'s card!**';
					
					this.state = 3;
					this.favor = selectedID;
				}
			} else if (this.state === 3) { // giving a favor
				if (userID === this.favor) {
					// get the selected card
					var num = undefined;
					
					if (/\d+/g.test(message)) {
						num = message.match(/\d+/g)[0];
					} else {
						str[userID] = '**You didn\'t select a card! Select a card by typing the number next to the card you want to select.**';
						break parse;
					}
					
					var give = this.playerHands[userID][num];
					
					// if it's undefined, that's an invalid input
					if (give === undefined) {
						str[userID] = '**That\'s not a valid card to give! Make sure you have those cards.**';
						break parse;
					}
					
					// transfer the cards
					this.playerHands[this.playerOrder[this.current]].push(this.playerHands[userID].splice(num, 1)[0]);
					
					// change state back to normal and message everyone
					str[userID] = '**You have given this card to ' + this.playerOrder[this.current] + ':**\n\t' + give + '\n\nThis is now your hand:\n' + this.printHand(userID, '\t', false);
					str[this.playerOrder[this.current]] = '**' + userID + ' has given this card to you:**\n\t' + give + '\n\n' + this.printTurn();
					str['else'] = '**' + userID + ' has given a card to ' + this.playerOrder[this.current] + '!**';
					str['spectate'] = userID + ' gave this card to ' + this.playerOrder[this.current] + ':\n\t' + give + '\n' + this.playerOrder[this.current] + '\'s hand:\n' + this.printHand(this.playerOrder[this.current], '\t', false);
					
					this.state = 0;
					this.favor = undefined;
				}
			} else if (this.state === 4) { // reinserting an exploding kitten
				if (userID === this.playerOrder[this.current]) {
					// get the number that the user entered
					var num = undefined;
					
					if (/\d+/g.test(message)) {
						num = message.match(/\d+/g)[0];
					} else {
						str[userID] = '**You didn\'t select a position! Select a position in the draw pile by typing a number between 0 and ' + (this.draw.length - 1) + '.**';
						break parse;
					}
					
					// if the number is too low or high, that's an invalid position
					if (num >= this.draw.length) {
						str[userID] = '**That\'s not a valid position! The top card\'s position is 0, and the bottom card\'s position is ' + (this.draw.length - 1) + '.**';
						break parse;
					}
					
					// get the word the user entered
					var word = undefined;
					
					if (/[A-Za-z]+/g.test(word)) {
						word = message.match(/[A-Za-z]+/g)[0].toLowerCase();
					} else {
						str[userID] = '**You didn\'t select a direction! Select a direction by typing `above` or `below` the position you entered.**';
						break parse;
					}
					
					if (word === 'above' || word === 'up' || word === 'top' || word === 'a' || word === 'u' || word === 't') {
						// remove the exploding kitten from the player's deck
						this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Exploding Kitten'), 1);
						
						// place it above the specified position
						this.draw.splice(num, 0, new ExplodingKittensCard('Exploding Kitten'));
						
						// move to next player
						this.nextPlayer();
						
						this.state = 0;
						
						str[userID] = '**You\'ve placed the Exploding Kitten above the card at position ' + num + '!\nIt is now ' + this.playerOrder[this.current] + '\'s turn.**';
						str['else'] = '**' + userID + ' has returned the Exploding Kitten to somewhere in the draw pile!\nIt is now ' + this.playerOrder[this.current] + '\'s turn.**';
						str['spectate'] = userID + ' returned the Exploding Kitten above position ' + num + '\n\n' + this.playerOrder[this.current] + '\'s hand:\n' + this.printHand(this.playerOrder[this.current], '\t', false);
						break parse;
					} else if (word === 'below' || word === 'down' || word === 'bottom' || word === 'b' || word === 'd') { // place card below specified position
						// remove the exploding kitten from the player's deck
						this.playerHands[userID].splice(this.playerHands[userID].indexOfEK('Exploding Kitten'), 1);
						
						// place it below the specified position
						this.draw.splice(num + 1, 0, new ExplodingKittensCard('Exploding Kitten'));
						
						// move to next player
						this.nextPlayer();
						
						this.state = 0;
						
						str[userID] = '**You\'ve placed the Exploding Kitten below the card at position ' + num + '!\nIt is now ' + this.playerOrder[this.current] + '\'s turn.**';
						str['else'] = '**' + userID + ' has returned the Exploding Kitten to somewhere in the draw pile!\nIt is now ' + this.playerOrder[this.current] + '\'s turn.**';
						str['spectate'] = userID + ' returned the Exploding Kitten below position ' + num + '\n\n' + this.playerOrder[this.current] + '\'s hand:\n' + this.printHand(this.playerOrder[this.current], '\t', false);
						break parse;
					} else {
						str[userID] = '**That\'s not a valid direction! Type `above`, `up`, or `top` to place the card above the position, and `below`, `down`, or `bottom` to place the card below the position.**';
						break parse;
					}
				}
			} else if (this.state === 5) { // two of a kind combo was played
				if (userID === this.playerOrder[this.current]) {
					// get the number that the user entered
					var selection = undefined;
					
					if (/\d+/g.test(message)) {
						selection = message.match(/\d+/g)[0];
					} else {
						str[userID] = '**You didn\'t select a player! Select a player by typing the number next to their name.**';
						break parse;
					}
					
					// invalid player if they are dead
					if (currentlyAlive[selection] === undefined) {
						str[userID] = '**That\'s not a valid player! Make sure you\'ve entered the correct number of the player on the list above.**';
						break parse;
					}
					
					var selectedID = currentlyAlive[selection];
					
					// take a random card from the victim's hand
					var stolen = this.playerHands[selectedID].splice(randInt(this.playerHands[selectedID].length), 1)[0];
					
					// add it to the current player's hand
					this.playerHands[userID].push(stolen);
					
					this.state = 0;
					
					// change state and message the selected player for the favor
					str[userID] = '**You\'ve stolen a random card from ' + selectedID + '! You took:**\n\t' + stolen + '\n\n' + this.printTurn();
					str[selectedID] = '**' + userID + ' has chosen to steal a random card from you! They stole:**\n\t' + stolen + '\n\nThis is now your hand:\n' + this.printHand(selectedID, '\t', false);
					str['else'] = '**' + userID + ' has stolen a random card from ' + selectedID + '!**';
					str['spectate'] = userID + ' stole this card from ' + selectedID + ':\n\t' + stolen + '\n\n' + userID + '\'s hand:\n' + this.printHand(userID, '\t', false);
					
					this.favor = selectedID;
				}
			}
		}
		
		// handle drawing an exploding kitten
		if (userID === this.playerOrder[this.current] && drawn !== undefined && drawn.name === 'Exploding Kitten') {
			str[userID] = '**You drew an Exploding Kitten! ';
			str['else'] = '**' + userID + ' drew an Exploding Kitten! ';
			
			// check if they have a defuse, if they do, play it automatically; if not, they meet the wrath of elimination
			var savingDefuse = this.playerHands[userID].indexOfEK('Defuse');
			
			if (savingDefuse !== -1) { // defuse exists
				// remove the defuse
				this.discard.unshift(this.playerHands[userID][savingDefuse]);
				this.playerHands[userID].splice(savingDefuse, 1);
				
				// allow player to reinsert the exploding kitten where they'd like
				this.state = 4;
				
				str[userID] += 'Fortunately, you still have a Defuse card in your hand, which you have used to save yourself from utter destruction.**\nTop card: 0\nBottom card: ' + (this.draw.length - 1) + '\n\nYou have the opportunity to **reinsert** the Exploding Kitten back into the draw pile **wherever you\'d like.** Reinsert the card by typing a **position** in the draw pile followed by **`above`** or **`below`** the position you entered. For example, to place the Exploding Kitten at the top of the draw pile, type `0 above`; to place the Exploding Kitten right beneath the top card, type `0 below` or `1 above`.';
				str['else'] += 'Fortunately for them, they still have a Defuse card in their hand, which they have used to save themselves from utter destruction. They can now reinsert the Exploding Kitten wherever they\'d like.**';
			} else { // no defuse
				// discard all the player's cards
				this.discard.concat(this.playerHands[userID]);
				delete this.playerHands[userID];
				
				// move the player to the spectator list
				this.players.splice(this.players.indexOf(userID), 1);
				this.spectators.push(userID);
				
				// move to next player
				this.nextPlayer();
				
				str[userID] += 'Unfortunately, you did not have any Defuse card in your hand, and the Exploding Kitten blew up right in your face.\nAll your cards, including the Exploding Kitten, have been discarded.\nIt is now ' + this.playerOrder[this.current] + '\'s turn.**\n_You are now spectating the game._';
				str['else'] += 'Unfortunately for them, they did not have any Defuse card in their hand, and the Exploding Kitten blew up right in their\'s face.\nAll their cards, including the Exploding Kitten, have been discarded.\nIt is now ' + this.playerOrder[this.current] + '\'s turn.**';
				
				// check if there is one player left; if so, that player is the winner
				if (this.returnPlayers([]).length === 1) {
					this.victor = this.playerOrder[this.current];
				}
			}
		}
		
		return str;
	}
}



// represents a location and the roles in spyfall
class SpyfallLocation {
	constructor(location, ...roles) {
		this.name = location;
		this.roles = roles;
	}
}

// represents an instance of the spyfall game
class Spyfall {
	// 52 locations, 439 roles
	static locations = [
		new SpyfallLocation('Airplane', 'First Class Passenger', 'Air Marshall', 'Mechanic', 'Economy Class Passenger', 'Stewardess', 'Co-Pilot', 'Captain'),
		new SpyfallLocation('Amusement Park', 'Ride Operator', 'Parent', 'Food Vendor', 'Cashier', 'Happy Child', 'Annoying Child', 'Teenager', 'Janitor', 'Security Guard', 'Parent'),
		new SpyfallLocation('Art Museum', 'Ticket Seller', 'Student', 'Visitor', 'Teacher', 'Security Guard', 'Painter', 'Art Collector', 'Art Critic', 'Photographer', 'Tourist'),
		new SpyfallLocation('Bank', 'Armored Car Driver', 'Manager', 'Consultant', 'Customer', 'Robber', 'Security Guard', 'Teller'),
		new SpyfallLocation('Beach', 'Beach Waitress', 'Kite Surfer', 'Lifeguard', 'Thief', 'Beach Goer', 'Beach Photographer', 'Ice Cream Truck Driver'),
		new SpyfallLocation('Broadway Theater', 'Coat Check Lady', 'Prompter', 'Cashier', 'Visitor', 'Director', 'Actor', 'Crewman'),
		new SpyfallLocation('Candy Factory', 'Madcap Redhead', 'Pastry Chef', 'Visitor', 'Taster', 'Truffle Maker', 'Taster', 'Supply Worker', 'Oompa Loompa', 'Inspector', 'Machine Operator'),
		new SpyfallLocation('Casino', 'Bartender', 'Head Security Guard', 'Bouncer', 'Manager', 'Hustler', 'Dealer', 'Gambler'),
		new SpyfallLocation('Cat Show', 'Judge', 'Cat-Handler', 'Veterinarian', 'Security Guard', 'Cat Trainer', 'Crazy Cat Lady', 'Animal Lover', 'Cat Owner', 'Cat', 'Cat'),
		new SpyfallLocation('Cathedral', 'Priest', 'Beggar', 'Sinner', 'Parishioner', 'Tourist', 'Sponsor', 'Choir Singer'),
		new SpyfallLocation('Cemetery', 'Priest', 'Gothic Girl', 'Grave Robber', 'Poet', 'Mourning Person', 'Gatekeeper', 'Dead Person', 'Relative', 'Flower Seller', 'Grave Digger'),
		new SpyfallLocation('Circus Tent', 'Acrobat', 'Animal Trainer', 'Magician', 'Visitor', 'Fire Eater', 'Clown', 'Juggler'),
		new SpyfallLocation('Coal Mine', 'Safety Inspector', 'Miner', 'Overseer', 'Dump Truck Operator', 'Driller', 'Coordinator', 'Blasting Engineer', 'Miner', 'Solid Waste Engineer', 'Worker'),
		new SpyfallLocation('Construction Site', 'Free-Roaming Toddler', 'Contractor', 'Crane Driver', 'Trespasser', 'Safety Officer', 'Electrician', 'Engineer', 'Architect', 'Construction Worker', 'Construction Worker'),
		new SpyfallLocation('Corporate Party', 'Entertainer', 'Manager', 'Unwelcomed Guest', 'Owner', 'Secretary', 'Accountant', 'Delivery Boy'),
		new SpyfallLocation('Crusader Army', 'Monk', 'Imprisoned Arab', 'Servant', 'Bishop', 'Squire', 'Archer', 'Knight'),
		new SpyfallLocation('Day Spa', 'Customer', 'Stylist', 'Masseuse', 'Manicurist', 'Makeup Artist', 'Dermatologist', 'Beautician'),
		new SpyfallLocation('Embassy', 'Security Guard', 'Secretary', 'Ambassador', 'Government Official', 'Tourist', 'Refugee', 'Diplomat'),
		new SpyfallLocation('Gaming Convention', 'Blogger', 'Cosplayer', 'Gamer', 'Exhibitor', 'Collector', 'Child', 'Security Guard', 'Geek', 'Shy Person', 'Famous Person'),
		new SpyfallLocation('Gas Station', 'Car Enthusiast', 'Service Attendant', 'Shopkeeper', 'Customer', 'Car Washer', 'Cashier', 'Customer', 'Climate Change Activist', 'Service Attendant', 'Manager'),
		new SpyfallLocation('Harbor Docks', 'Loader', 'Salty Old Pirate', 'Captain', 'Sailor', 'Loader', 'Fisherman', 'Exporter', 'Cargo Overseer', 'Cargo Inspector', 'Smuggler'),
		new SpyfallLocation('Hospital', 'Nurse', 'Doctor', 'Anesthesiologist', 'Intern', 'Patient', 'Therapist', 'Surgeon'),
		new SpyfallLocation('Hotel', 'Doorman', 'Security Guard', 'Manager', 'Housekeeper', 'Customer', 'Bartender', 'Bellman'),
		new SpyfallLocation('Ice Hockey Stadium', 'Hockey Fan', 'Medic', 'Hockey Player', 'Food Vendor', 'Security Guard', 'Goaltender', 'Coach', 'Referee', 'Spectator', 'Hockey Player'),
		new SpyfallLocation('Jail', 'Wrongly Accused Man', 'CCTV Operator', 'Guard', 'Visitor', 'Lawyer', 'Janitor', 'Jailkeeper', 'Criminal', 'Correctional Officer', 'Maniac'),
		new SpyfallLocation('Jazz Club', 'Bouncer', 'Drummer', 'Pianist', 'Saxophonist', 'Singer', 'Jazz Fanatic', 'Dancer', 'Barman', 'VIP', 'Waiter'),
		new SpyfallLocation('Library', 'Old Man', 'Journalist', 'Author', 'Volunteer', 'Know-It-All', 'Student', 'Librarian', 'Loudmouth', 'Book Fanatic', 'Nerd'),
		new SpyfallLocation('Military Base', 'Deserter', 'Colonel', 'Medic', 'Soldier', 'Sniper', 'Officer', 'Tank Engineer'),
		new SpyfallLocation('Movie Studio', 'Stuntman', 'Sound Engineer', 'Cameraman', 'Director', 'Costume Artist', 'Actor', 'Producer'),
		new SpyfallLocation('Night Club', 'Regular', 'Bartender', 'Security Guard', 'Dancer', 'Pick-Up Artist', 'Party Girl', 'Model', 'Muscly Guy', 'Drunk Person', 'Shy Person'),
		new SpyfallLocation('Ocean Liner', 'Rich Passenger', 'Cook', 'Captain', 'Bartender', 'Musician', 'Waiter', 'Mechanic'),
		new SpyfallLocation('Passenger Train', 'Mechanic', 'Border Patrol', 'Train Attendant', 'Passenger', 'Restaurant Chef', 'Engineer', 'Stoker'),
		new SpyfallLocation('Pirate Ship', 'Cook', 'Sailor', 'Slave', 'Cannoneer', 'Bound Prisoner', 'Cabin Boy', 'Brave Captain'),
		new SpyfallLocation('Polar Station', 'Medic', 'Geologist', 'Expedition Leader', 'Biologist', 'Radioman', 'Hydrologist', 'Meteorologist'),
		new SpyfallLocation('Police Station', 'Detective', 'Lawyer', 'Journalist', 'Criminalist', 'Archivist', 'Patrol Officer', 'Criminal'),
		new SpyfallLocation('Race Track', 'Team Owner', 'Driver', 'Engineer', 'Spectator', 'Referee', 'Mechanic', 'Food Vendor', 'Commentator', 'Bookmaker', 'Spectator'),
		new SpyfallLocation('Restaurant', 'Musician', 'Customer', 'Bouncer', 'Hostess', 'Head Chef', 'Food Critic', 'Waiter'),
		new SpyfallLocation('Retirement Home', 'Relative', 'Cribbage Player', 'Old Person', 'Nurse', 'Janitor', 'Cook', 'Blind Person', 'Psychologist', 'Old Person', 'Nurse'),
		new SpyfallLocation('Rock Concert', 'Dancer', 'Singer', 'Fan', 'Guitarist', 'Drummer', 'Roadie', 'Stage Diver', 'Security Guard', 'Bassist', 'Technical Support'),
		new SpyfallLocation('School', 'Gym Teacher', 'Student', 'Principal', 'Security Guard', 'Janitor', 'Lunch Lady', 'Maintenance Man'),
		new SpyfallLocation('Service Station', 'Manager', 'Tire Specialist', 'Biker', 'Car Owner', 'Car Wash Operator', 'Electrician', 'Auto Mechanic'),
		new SpyfallLocation('Sightseeing Bus', 'Old Man', 'Lone Tourist', 'Driver', 'Annoying Child', 'Tour Guide', 'Photographer', 'Lost Person', 'Tourist', 'Tourist', 'Tourist'),
		new SpyfallLocation('Space Station', 'Engineer', 'Alien', 'Space Tourist', 'Pilot', 'Commander', 'Scientist', 'Doctor'),
		new SpyfallLocation('Stadium', 'Medic', 'Hammer Thrower', 'Athlete', 'Commentator', 'Spectator', 'Security Guard', 'Referee', 'Food Vendor', 'High Jumper', 'Sprinter'),
		new SpyfallLocation('Submarine', 'Cook', 'Commander', 'Sonar Technician', 'Electronics Technician', 'Sailor', 'Radioman', 'Navigator'),
		new SpyfallLocation('Subway', 'Tourist', 'Subway Operator', 'Ticket Inspector', 'Pregnant Lady', 'Pickpocket', 'Cleaner', 'Businessman', 'Ticket Seller', 'Old Lady', 'Blind Man'),
		new SpyfallLocation('Supermarket', 'Customer', 'Cashier', 'Butcher', 'Janitor', 'Security Guard', 'Food Sample Demonstrator', 'Shelf Stocker'),
		new SpyfallLocation('The U.N.', 'Diplomat', 'Interpreter', 'Blowhard', 'Tourist', 'Napping Delegate', 'Journalist', 'Secretary of State', 'Speaker', 'Secretary-General', 'Lobbyist'),
		new SpyfallLocation('University', 'Graduate Student', 'Professor', 'Dean', 'Psychologist', 'Maintenance Man', 'Student', 'Janitor'),
		new SpyfallLocation('Vineyard', 'Gardener', 'Gourmet Guide', 'Winemaker', 'Exporter', 'Butler', 'Wine Taster', 'Sommelier', 'Rich Lord', 'Vineyard Manager', 'Enologist'),
		new SpyfallLocation('Wedding', 'Ring Bearer', 'Groom', 'Bride', 'Officiant', 'Photographer', 'Flower Girl', 'Father of the Bride', 'Wedding Crasher', 'Best Man', 'Relative'),
		new SpyfallLocation('Zoo', 'Zookeeper', 'Visitor', 'Photographer', 'Child', 'Veterinarian', 'Tourist', 'Food Vendor', 'Cashier', 'Zookeeper', 'Researcher'),
	];
	
	constructor(players, spectators) {
		// pick a random location for the game
		this.location = Spyfall.locations[randInt(Spyfall.locations.length)];
		
		// make sure the location chosen has enough roles
		while (this.location.roles.length < players.length) {
			this.location = Spyfall.locations[randInt(Spyfall.locations.length)];
		}
		
		var possibleRoles = this.location.roles.slice(0, this.location.roles.length); // copy role list
		
		// assign players random roles (including spy)
		var spyIndex = randInt(players.length);
		this.playerRoles = {};
		
		for (var i = 0; i < players.length; ++i) {
			var id = players[i];
			this.playerRoles[id] = i === spyIndex ? 'Spy' : possibleRoles.splice(randInt(possibleRoles.length), 1)[0];
		}
		
		// pick a random player to start
		this.asking = players[randInt(players.length)];
		this.answering = undefined;
	}
}



// distant galaxy goes here (my game :D)



module.exports = {
	// given a room object, return an instance of a game depending on players and the game
	instance: function(room) {
		if (room.game === 'Battleship') {
			return new Battleship();
		} else if (room.game === 'Exploding Kittens') {
			return new ExplodingKittens(room.players, room.spectators);
		} else if (room.game === 'Spyfall') {
			return new Spyfall(room.players, room.spectators);
		}
	},
	
	// is this lobby ready to party; returns true if set up, returns a reason why if not set up
	lobbyReady: function(room) {
		if (room.game === 'Exploding Kittens') {
			if (room.players.length >= 2 && room.players.length <= 10) {
				return true;
			} else {
				return '**This game only supports 2 to 10 players.**';
			}
		} else if (room.game === 'Spyfall') {
			if (room.players.length >= 3 && room.players.length <= 10) {
				return true;
			} else {
				return '**This game only supports 3 to 10 players. The recommended amount of players is 5.**';
			}
		}
	},
}