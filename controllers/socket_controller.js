/**
 * Socket Controller
 */

const debug = require("debug")("game:socket_controller");

let io = null; // socket.io server instance

// {
//     username: "somename",
//     userId: "23414122131",
//     room: "game-23414122131",
// }
let lookingForMatch = [];

// "game-2341412213": {
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

// get random number between 1-64
const getRandomNumber = (num) => {
	return Math.ceil(Math.random() * num);
};

const startGame = async (room, player1, player2) => {
	//debug(room, player1, player2);
	activeMatches[room] = {
		player1: {
			...player1,
			wins: 0,
			fastestTime: -1,
		},
		player2: {
			...player2,
			wins: 0,
			fastestTime: -1,
		},
		rounds: [],
	};

	debug(activeMatches);
	//Stage 1 of game - send all info
	io.to(room).emit("game:start", activeMatches[room]);
	debug("Sent to room", room);
	setTimeout(() => {
		//start first round
		io.to(room).emit("game:newround", getRandomNumber(64));
	}, getRandomNumber(10) * 1000 + 5000);
};

// Handle when a user entered name and started to matchamke
const handleUserJoined = async function (username, callback) {
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
		debug("User " + username + " joined " + "game-" + partner.room);
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

		// , (status) => {
		// 	if (status.success) {
		// 		debug("match successful");

		// 		lookingForMatch.shift();
		// 	} else {
		// 		//next id?
		// 	}
		// }
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

module.exports = function (socket, _io) {
	io = _io;
	//Log when user connects
	debug("a new client has connected", socket.id);

	// handle user joined
	socket.on("user:joined", handleUserJoined);
};
