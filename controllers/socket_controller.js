/**
 * Socket Controller
 */

const debug = require("debug")("game:socket_controller");

let io = null; // socket.io server instance

let lookingForMatch = [];

let activeMatches = {};

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
		io.to(partner.userId).emit("user:foundmatch", partner);

		//Join the room and remove from array, needs to check if partner is still there in the future
		this.join("game-" + partner.room);
		lookingForMatch.shift();

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
		this.join("game-" + username);
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
