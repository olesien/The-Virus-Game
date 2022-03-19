const socket = io();
const messageForm = document.querySelector("#message-form"); //username form
const startPageEl = document.querySelector(".start-page");
const appEl = document.querySelector("#app");
const gridBoxes = document.querySelectorAll(".grid-box");
const gameBoardTitle = document.querySelector(".main-window__bar-link");
const roundsEl = document.querySelector(".rounds");
const scoreboardEl = document.querySelector(".scoreboard-list");
const scoreboardEl1 = document.querySelector("#scoreboard-list-1");
const scoreboardEl2 = document.querySelector("#scoreboard-list-2");
const scoreboardWrapperEl = document.querySelector(".scoreboard-wrapper");
const loadingIcon = document.querySelector('.loading');
const inputBtn = document.querySelector(".start-page__input-btn");

let activeRoom = null;
let username = null;
let roundCounter = 0;
let opponent = "player2";

// add virus to random grid box
const addVirus = (randomNumber) => {
	const virusEl = gridBoxes[randomNumber];
	virusEl.classList.add("virus");
	let clicked = false;
	virusEl.addEventListener("click", () => {
		//alert("clicked virus");
		virusEl.classList.remove("virus");

		//Send click event to server
		if (!clicked) {
			socket.emit("game:clicked-virus", activeRoom, (status) => {
				// we've received acknowledgement from the server

				if (!status.success) {
					console.log(status.error);

					alert("Something went wrong. Check console for details");
				} else {
					console.log("Won: " + status.won);
					clicked = true;
					console.log("You have clicked the virus");
				}
			});
		}
	});
};

//  Count up/Countdown Clock
const clock = {
	totalSeconds: 0,
	startTimerForLobby: function () {
		if (!this.interval) {
			const self = this;

			function pad(val) {
				return val > 9 ? val : "0" + val;
			}

			this.interval = setInterval(function () {
				self.totalSeconds += 1;
				const timerMinuts = pad(Math.floor(self.totalSeconds / 60 % 60)),
					timerSeconds = pad(parseInt(self.totalSeconds % 60));
				document.querySelector(".start-page__lobby-timer").textContent = `${timerMinuts}:${timerSeconds}`
			}, 1000);
		}
	},
	resetTimerForLobby: function () {
		clock.totalSeconds = null;
		clearInterval(this.interval);
		document.querySelector(".start-page__lobby-timer").textContent = `00:00`
		delete this.interval;
	},
	roundTimer: function () {
		gameBoardTitle.style.textAlign = 'center';
		gameBoardTitle.textContent = 'Time Until Game Starts 5 Seconds';

		let timer = 4, // seconds
			seconds;
		const inter = setInterval(function () {
			seconds = parseInt(timer % 60, 10);
			gameBoardTitle.textContent = `Time Until Game Starts ${seconds} Seconds`;
			if (timer-- < 1) {
				gameBoardTitle.textContent = "Virus can appear at any moment, be ready!";
				clearInterval(inter);

			}
		}, 1000);


	},

};

const startGame = (match, friend, foe) => {
	//match contains everything needed to set up scoreboard etc, use "opponent" as key for foe

	// round view
	roundsEl.classList.toggle('hide');
	//	scoreboard view
	scoreboardEl1.classList.toggle('hide');
	scoreboardEl2.classList.toggle('hide');
	// hide start view
	startPageEl.classList.add("hide");

	// show game view
	appEl.classList.remove("hide");

	// increment rounds
	match.rounds++;

	// create new li element
	const liEl = document.createElement("div");

	// add class of scoreinfo to li
	liEl.classList.add("scoreinfo", 'scoreboard-list');

	// set content of li
	// liEl.innerHTML = `<span class="friend">${friend}</span>
	// <span class="foe">${foe}</span>`;

	// append li to ul
	// scoreboardEl.appendChild(liEl);

	// Round Timer
	clock.roundTimer();
};

//New round received, start new round with new virus!
socket.on("game:newround", (randomNumber) => {
	addVirus(randomNumber);
	console.log("Started new round and added number");
});

//See how the round went!
socket.on("game:roundresult", (game) => {

	//opponent for your opponent, use game[player] to get your own name,id,wins,fastestTime, game[opponent] for same but the enemy
	const player = opponent === "player1" ? "player2" : "player1";


	// create new li element
	const liEl = document.createElement('div');
	// add class of scoreinfo to li
	liEl.classList.add('scoreinfo');

	if (game[player].latestTime < game[opponent].latestTime) {

		liEl.innerHTML = `<div class="round-wrapper winner">
        <p class="winner-title">Winner:
        <span class="winner-name">${game[player].name}</span><br>
        <p class="reaction">Reaction times</p>
        <span class="player-name">${game[player].name}: </span>
        <span class="player-time">${Math.floor(game[player].latestTime) / 1000}</span>
        <span class="opponent-name">${game[opponent].name}: </span>
        <span class="opponent-time">${Math.floor(game[opponent].latestTime) / 1000}</span>
        </div>`;
		if (roundCounter < 6) {
			scoreboardEl1.appendChild(liEl);
		} else {
			scoreboardEl2.appendChild(liEl);
		}


	} else if (game[opponent].latestTime < game[player].latestTime) {

		liEl.innerHTML = `<div class="round-wrapper loser">
        <p class="winner-title">Winner:
        <span class="winner-name">${game[opponent].name}</span><br>
        <p class="reaction">Reaction times</p>
        <span class="player-name">${game[player].name}: </span>
        <span class="player-time">${Math.floor(game[player].latestTime) / 1000}</span>
        <span class="opponent-name">${game[opponent].name}: </span>
        <span class="opponent-time">${Math.floor(game[opponent].latestTime) / 1000}s</span>
        </div>`;

		if (roundCounter < 5) {
			scoreboardEl1.appendChild(liEl);
		} else {
			scoreboardEl2.appendChild(liEl);
		}
	}


	// time spent on cllick
	const player_you = game[player].fastestTime,
		player_opponent = game[opponent].fastestTime;

	// check which person won and lose
	if (game.rounds[game.rounds.length - 1].winner === player) {
		gameBoardTitle.style.color = '#00BE5F';
		gameBoardTitle.textContent = `Win: +${Math.floor(player_opponent - player_you) / 1000} Seconds`;
		setTimeout(() => {
			gameBoardTitle.style.color = 'white';
			clock.roundTimer();
		}, 900)


	} else if (game.rounds[game.rounds.length - 1].loser === player) {
		gameBoardTitle.style.color = '#BE3900';
		gameBoardTitle.textContent = `Lose: -${Math.floor(player_you - player_opponent) / 1000} Seconds`;
		setTimeout(() => {
			gameBoardTitle.style.color = 'white';
			clock.roundTimer();
		}, 900);

	}


	// Game Over screen Statistic
	const gameOverRoundBreakdownCircleBox = document.querySelector('.game-over__round-breakdown-circle-box'),
		gameOverRoundBreakdownCircle = document.createElement('div'),
		gameOverTitle = document.querySelector('.game-over__title');
	gameOverRoundBreakdownCircle.classList.add('game-over__round-breakdown-circle');

	const gameOverTimeRecordsBox1 = document.querySelector('.game-over__time-records-box-1');
	const gameOverTimeRecordsBox2 = document.querySelector('.game-over__time-records-box-2');
	const timeRecords = (speed, el) => {
		roundCounter++;
		roundsEl.textContent = `Round:${roundCounter}/10`
		let gameOverPlayerStatsText = document.createElement('span');
		gameOverPlayerStatsText.classList.add('game-over__player-stats-text');
		gameOverPlayerStatsText.textContent = `Round ${roundCounter}: ${speed}`;
		el.appendChild(gameOverPlayerStatsText)
	}


	if (game[player].latestTime < game[opponent].latestTime) {
		gameOverRoundBreakdownCircle.classList.add('winner');
		gameOverRoundBreakdownCircleBox.appendChild(gameOverRoundBreakdownCircle);
		gameOverTitle.textContent = 'Congrats on your Win';
		if (roundCounter < 5) timeRecords(Math.floor(game[player].latestTime) / 1000, gameOverTimeRecordsBox1)
		else timeRecords(Math.floor(game[player].latestTime) / 1000, gameOverTimeRecordsBox2)

	} else if (game[opponent].latestTime < game[player].latestTime) {
		gameOverRoundBreakdownCircle.classList.add('loser');
		gameOverRoundBreakdownCircleBox.appendChild(gameOverRoundBreakdownCircle);
		gameOverTitle.textContent = 'Try better next time';
		if (roundCounter < 5) timeRecords(Math.floor(game[player].latestTime) / 1000, gameOverTimeRecordsBox1);
		else timeRecords(Math.floor(game[player].latestTime) / 1000, gameOverTimeRecordsBox2);
	}

	if (game.player1.wins === game.player2.wins) gameOverTitle.textContent = 'TIE';
});

//All 10 rounds done, end game
socket.on("game:end", (game) => {
	console.log(game);

	/*
		const rematchEl = document.createElement('button');
		const lobbyEl = document.createElement('button');

		rematchEl.classList.add('rematch');
		lobbyEl.classList.add('lobby');

		rematchEl.innerHTML = "Rematch"
		lobbyEl.innerHTML = "Go To Lobby"

		scoreboardWrapperEl.append(rematchEl);
		scoreboardWrapperEl.append(lobbyEl);
	*/


	const gameOver = document.querySelector('.game-over'),
		gameOverBtnReturnToLobby = document.querySelector('.game-over__btn-return-to-lobby'),
		gameOverBtnGoAgain = document.querySelector('.game-over__btn-go-again');


	//	show Game over screen
	appEl.classList.toggle('hide');
	gameOver.classList.toggle('hide');
	gameBoardTitle.style.display = 'none'
	gameBoardTitle.style.color = 'white'

// Return to Lobby
	gameOverBtnReturnToLobby.addEventListener('click', () => {
		// Reset
		game.player1.wins = 0;
		game.player2.wins = 0;
		roundCounter = 0;

		// Styling
		gameOver.classList.add('hide');
		startPageEl.classList.remove('hide');
		roundsEl.classList.add('hide');
		loadingIcon.classList.add('hide');
		scoreboardEl1.classList.add('hide')
		scoreboardEl2.classList.add('hide')

		gameBoardTitle.style.display = 'block'
		gameBoardTitle.textContent = 'https://thevirusgame.com';

		document.querySelector(".start-page__input-btn").textContent = "Start Searching";
		document.querySelector(".start-page__title").textContent = "Enter your Name to play";

		clock.resetTimerForLobby();

		document.querySelectorAll('.game-over__round-breakdown-circle').forEach(e => e.remove())
		document.querySelectorAll('.game-over__player-stats-text').forEach(e => e.remove())
		document.querySelectorAll('.round-wrapper').forEach(e => e.remove())

		inputBtn.appendChild(loadingIcon);
	});
	//	!TODO GO AGAIN BUTTON
	gameOverBtnGoAgain.addEventListener('click', () => {

	})
});

//Game now has the match info including opponent etc, and will start setting up all required details
socket.on("game:start", (match) => {
	//console.log(match);
	console.log("Foe: " + match[opponent].name + " You: " + username);

	//Move to start game function to set up scoreboard and unhide the game
	startGame(match, username, match[opponent].name);

	//alert("Game started ooo");
});

//This is just to set the room and opponent for later use
socket.on("user:foundmatch", (partner) => {
	//console.log(partner);
	activeRoom = partner.room;
	opponent = "player1";
	console.log("active room: " + activeRoom);
});


// get username and room from form and emit `user:joined` and then show chat
messageForm.addEventListener("submit", (e) => {
	e.preventDefault();

	username = messageForm.message.value;

	console.log(`User ${username} wants to connect`);

	// emit `user:joined` event and when we get acknowledgement, THEN show the chat
	socket.emit("user:joined", username, (status) => {
		// we've received acknowledgement from the server
		console.log("Server acknowledged that user joined", status);

		if (status.success) {
			console.log(status);
			activeRoom = status.partner ? status.partner?.room : null;
			console.log("ACTIVE ROOM: --- " + activeRoom);

			// Start lobby Timer
			clock.startTimerForLobby();

			// Change  Text for Title and Button
			document.querySelector(".start-page__title").textContent = "Lobby status 1/2";
			inputBtn.textContent = "Please wait for second player";
			// Loading spinner Proportions and apply to button
			loadingIcon.classList.remove('hide')
			inputBtn.appendChild(loadingIcon)

			if (activeRoom) {
				//Found match already, someone was waiting
				//startGame(status.partner.username);  //Partially Replaced by game:start

				console.log("active room: " + activeRoom);
			}
		}
	});
});


