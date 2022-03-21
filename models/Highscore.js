/**
 * Highscore Model
 */

 const mongoose = require('mongoose');

 // Declare Model Schema
 const highScoreSchema = new mongoose.Schema({
 
 });
 
 // Declare Model 
 const Highscore = mongoose.model('Game', highScoreSchema);
 
 // Export Model
 module.exports = Highscore;