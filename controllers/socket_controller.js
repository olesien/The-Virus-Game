/**
 * Socket Controller
 */

const debug = require("debug")("game:socket_controller");
const models = require("../models");

let io = null; // socket.io server instance

// {
//     username: "somename",
//     userId: "23414122131",
//     room: "game-23414122131",
// }
let lookingForMatch = [];

// "game-2341412213": {
//     startRoundTime: 213131
//     player1: {
//         name: "somename",
//         id: "23414122131",
//         wins: 1,
//         fastestTime: 1
//     },
//     player2: {
//         name: "othername",
//         id: "424214114",
//         wins: 2,
//         fastestTime: 0.9
//     },
//     rounds: [
//         {
//             winner: "player1",
//             winnerTime: 1.2,
//             loser: "player2",
//             loserTime: 1.3,
//         },
//         {
//             winner: "player1",
//             winnerTime: 1.3,
//             loser: "player2",
//             loserTime: 1.5,
//         }
//     ]
// }
let activeMatches = {};

// get random number
const getRandomNumber = (num) => {
	return Math.ceil(Math.random() * num);
};

//New round
const newRound = async (room, max, offset) => {
	setTimeout(() => {
		debug("SENDING TO NEW ROUND");
		io.to(room).emit("game:newround", getRandomNumber(64));
		activeMatches[room].startRoundTime = Date.now();
	}, getRandomNumber(max) * 1000 + offset * 1000);
};

const startGame = async (room, player1, player2) => {
	//debug(room, player1, player2);
	activeMatches[room] = {
		startRoundTime: 0,
		player1: {
			...player1,
			wins: 0,
			fastestTime: -1,
			latestTime: -1,
		},
		player2: {
			...player2,
			wins: 0,
			fastestTime: -1,
			latestTime: -1,
		},
		rounds: [],
	};

	debug(activeMatches);
	//Stage 1 of game - send all info
	io.to(room).emit("game:start", activeMatches[room]);
	debug("Sent to room", room);
	//start first round
	newRound(room, 10, 5);
};

// Handle when a user clicks virus!
const handleClickedVirus = async function (room, callback) {
	debug("HANDLING VIRUS CLICKED");
	//Handle errors
	try {
		//Set the player who clicked this to either player1 or player2 in activeMatch object
		let player =
			activeMatches[room].player1.id === this.id ? "player1" : "player2";
		//same as above but.. opposite
		let opponent =
			activeMatches[room].player1.id === this.id ? "player2" : "player1";

		//Get time passed
		const currentTime = Date.now();

		//Get time passed, current time - time when round started
		const timePassed =
			Number(currentTime) - Number(activeMatches[room].startRoundTime);

		//Set player time passed..
		activeMatches[room][player].latestTime = timePassed;
		//Did the player win?
		let won;

		//Fastest reaction thus far?
		const fastestTime = Number(activeMatches[room][player].fastestTime);
		if (fastestTime <= 0 || timePassed < fastestTime) {
			//push fastest time!
			activeMatches[room][player].fastestTime = timePassed;
		}
		if (activeMatches[room][opponent].latestTime <= 0) {
			//player was first!
			debug(activeMatches[room][player].name + " was first! (hero)");
			activeMatches[room][player].wins += 1;

			won = true;
		} else {
			//enemy was first
			debug(activeMatches[room][opponent].name + " was first! (villain)");
			//Reset clock
			activeMatches[room].startRoundtime = 0;
			won = false;
			//Add to score, as the one who lost will be the one with all the data
			activeMatches[room].rounds.push({
				winner: opponent,
				winnerTime: activeMatches[room][opponent].latestTime,
				loser: player,
				loserTime: activeMatches[room][player].latestTime,
			});

			//Send this information of all rounds to both sides through game:roundresult
			debug("Sending round result to room: " + room);
			io.to(room).emit("game:roundresult", activeMatches[room]);

			//Is it NOT round 10 or above? If so issue a new rounnd <--- Change here for shorter matches
			if (activeMatches[room].rounds.length < 10) {
				//Start new round here
				activeMatches[room][player].latestTime = -1;
				activeMatches[room][opponent].latestTime = -1;
				newRound(room, 10, 5);
			} else {
				//This is round 10 or somehow round 11+
				//Send match results, and allow the players to retry or return to home screen
				io.to(room).emit("game:end", activeMatches[room]);

				//Add to database this match
				const doc = models.Game({
					gameId: room,
					player1: activeMatches[room][player].name,
					player2: activeMatches[room][opponent].name,
					winner: opponent,
					loser: player,
					Timestamp: Date.now(),
					rounds: activeMatches[room].rounds,
				});

				doc.save();

				//Cleanup
				delete activeMatches[room];
				io.in(room).socketsLeave(room);
			}
		}

		// confirm success
		callback({
			success: true,
			won,
		});
	} catch (error) {
		debug(error);
		callback({
			success: false,
			error,
		});
	}
};

// Handle when a user entered name and started to matchamke
const handleFindMatch = async function (username, callback) {
	debug(
		`User ${username} with socket id ${this.id} wants to find a game. People looking for match: ${lookingForMatch}`
	);

	let friend = null;

	if (lookingForMatch.length > 0) {
		//Someone else is looking for a game!
		//try connection
		const partner = lookingForMatch[0];

		//Check so other person is still in
		io.to(partner.userId).emit("user:foundmatch", partner); //<- Partially Replaced by game:start

		//Join the room and remove from array, needs to check if partner is still there in the future
		debug("User " + username + " joined " + partner.room);
		this.join(partner.room);
		lookingForMatch.shift();

		const player1 = {
			name: username,
			id: this.id,
		};

		const player2 = {
			name: partner.username,
			id: partner.userId,
		};
		startGame(partner.room, player1, player2);
		friend = partner;
	} else {
		//Set up new game!
		// join room

		this.join("game-" + this.id);
		debug("User " + username + " joined " + "game-" + "userId");

		lookingForMatch.push({
			username,
			userId: this.id,
			room: "game-" + this.id,
		});
		debug(lookingForMatch);
	}

	// confirm join
	callback({
		success: true,
		partner: friend,
	});

	// broadcast list of users in room to all connected sockets EXCEPT ourselves
	//this.broadcast.to(room.id).emit("user:list", room.users);
};

//Cancel matching
const cancelMatchmaking = async function (id) {
	try {
		debug(`Client ${id} will be removed from match`);
		let hasRemoved = false;
		lookingForMatch.forEach((person, index) => {
			if (person.userId == id) {
				//remove this index
				lookingForMatch.splice(index, 1);
				hasRemoved = true;
			}
		});
		debug(lookingForMatch);

		return {
			success: true,
			hasRemoved,
		};
	} catch (error) {
		debug(error);

		return {
			success: false,
			error,
		};
	}
};

//Received when disconnected, cancel match!
const handleDisconnect = async function () {
	cancelMatchmaking(this.id);
};

//Received when user decides to cancel searching. result is the return with success true/false and hasRemoved or error
const handleCancelMatchmaking = async function (callback) {
	const result = await cancelMatchmaking(this.id);
	callback(result);
};

const handlePrevGames = async function (callback) {
	try {
		const prevgames = await models.Game.find()
			.sort("field -Timestamp")
			.limit(10);
		debug(prevgames);
		callback({ success: true, prevgames });
	} catch (error) {
		callback({ success: false, error });
		debug(error);
	}
};

module.exports = function (socket, _io) {
	io = _io;
	//Log when user connects
	debug("a new client has connected", socket.id);

	// handle user clicked on virus
	socket.on("game:clicked-virus", handleClickedVirus);

	// handle user joined
	socket.on("user:findmatch", handleFindMatch);

	//Get games for -> recent games
	socket.on("user:prevgames", handlePrevGames);

	// handle user disconnect
	socket.on("disconnect", handleDisconnect);

	//handle cancel matchmaking
	socket.on("user:cancelmatching", handleCancelMatchmaking);
};
