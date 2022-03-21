/**
 * Game Model
 */

const mongoose = require("mongoose");

// Declare Model Schema
const gameSchema = new mongoose.Schema({
	gameId: String,
	player1: String,
	player2: String,
	winner: "player1" | "player2",
	loser: "player1" | "player2",
	Timestamp: Number,
	rounds: [
		{
			winner: "player1" | "player2",
			winnerTime: Number,
			loser: "player1" | "player2",
			loserTime: Number,
		},
	],
});

// Declare Model
const Game = mongoose.model("Game", gameSchema);

// Export Model
module.exports = Game;
