/**
 * Game Model
 */

const mongoose = require('mongoose');

// Declare Model Schema
const gameSchema = new mongoose.Schema({

});

// Declare Model 
const Game = mongoose.model('Game', gameSchema);

// Export Model
module.exports = Game;