/**
 * Socket Controller
 */

const debug = require("debug")("game:socket_controller");

//list of sockets ids and hteir usernames
const users = {};

module.exports = function (socket) {
	debug("a new client has connected", socket.id);
};
