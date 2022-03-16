/**
 * Socket Controller
 */

const debug = require("debug")("game:socket_controller");

let activeMatches = {};

// Handle when a user entered name and started to matchamke
const handleUserJoined = async function (username, callback) {
	debug(`User ${username} with socket id ${this.id} wants to find a game`);

	// confirm join
	callback({
		success: true,
	});

	// broadcast list of users in room to all connected sockets EXCEPT ourselves
	//this.broadcast.to(room.id).emit("user:list", room.users);
};

module.exports = function (socket) {
	//Log when user connects
	debug("a new client has connected", socket.id);

	// handle user joined
	socket.on("user:joined", handleUserJoined);
};
