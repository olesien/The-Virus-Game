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
	setTimeout(() => {
		//start first round

		io.to(room).emit("game:newround", getRandomNumber(64));
		activeMatches[room].startRoundTime = Date.now();
	}, getRandomNumber(10) * 1000 + 5000);
};

// Handle when a user clicks virus!
const handleClickedVirus = async function (room, callback) {
	//let activeMatch = activeMatches[room];
	debug(activeMatches);
	debug(room);
	debug("active match: ", activeMatches[room]);
	//Set the player who clicked this to either player1 or player2 in activeMatch object
	let player =
		activeMatches[room].player1.id === this.id ? "player1" : "player2";
	//same as above but.. opposite
	let opponent =
		activeMatches[room].player1.id === this.id ? "player2" : "player1";

	//Get time passed

	const currentTime = Date.now();
	// debug(
	// 	"Time at start: " +
	// 		activeMatches[room].startRoundTime +
	// 		" Current Time: " +
	// 		currentTime
	// );

	// debug(Number(currentTime));
	// debug(activeMatches[room]);
	// debug(activeMatches[room].startRoundTime);
	// debug(Number(activeMatches[room].startRoundTime));

	const timePassed =
		Number(currentTime) - Number(activeMatches[room].startRoundTime);
	// debug(activeMatches[room][player]);
	// debug(activeMatches[room][opponent]);
	// debug(timePassed);

	//Set player time passed..
	activeMatches[room][player].latestTime = timePassed;
	debug("Time passed: " + activeMatches[room][player].latestTime);
	let won;

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
	}

	//Fastest reaction thus far?
	const fastestTime = Number(activeMatches[room][player].fastestTime);
	if (fastestTime <= 0 || timePassed < fastestTime) {
		//push fastest time!
		activeMatches[room][player].fastestTime = timePassed;
	}

	//Add to score

	//Next round

	// confirm success
	callback({
		success: true,
		data: { won, match: activeMatches[room] },
	});

	// broadcast list of users in room to all connected sockets EXCEPT ourselves
	//this.broadcast.to(room.id).emit("user:list", room.users);
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

const handleDisconnect = function () {
	debug(`Client ${this.id} disconnected :(`);
	lookingForMatch.forEach((person, index) => {
		if (person.userId == this.id) {
			//remove this index
			lookingForMatch.splice(index, 1);
		}
	});
};

module.exports = function (socket, _io) {
	io = _io;
	//Log when user connects
	debug("a new client has connected", socket.id);

	// handle user clicked on virus
	socket.on("game:clicked-virus", handleClickedVirus);

	// handle user joined
	socket.on("user:joined", handleUserJoined);

	// handle user disconnect
	socket.on("disconnect", handleDisconnect);
};
