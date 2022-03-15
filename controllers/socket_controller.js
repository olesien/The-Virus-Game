/**
 * Socket Controller
 */

const debug = require("debug")("game:socket_controller");

module.exports = function (socket) {
	//Log when user connects
	debug("a new client has connected", socket.id);
};
