const socket = io();
const messageForm = document.querySelector("#message-form"); //username form
const startPageEl = document.querySelector(".start-page");
const appEl = document.querySelector("#app");
const gridBoxes = document.querySelectorAll(".grid-box");
const gameBoardTitle = document.querySelector(".main-window__bar-link");
const roundsEl = document.querySelector(".rounds");
const scoreboardEl = document.querySelector(".scoreboard-list");
const scoreboardWrapperEl = document.querySelector(".scoreboard-wrapper");

const startSearchingEl = document.querySelector(".start-page__input-btn"),
	startPageLobbyTimerEl = document.querySelector(".start-page__lobby-timer");

let activeRoom = null;
let username = null;

let isSearching = false;

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
const newRoundTimer = () => {
	gameBoardTitle.style.textAlign = "center";
	gameBoardTitle.textContent = "Time Until Game Starts 5 Seconds";
	let timer = 4, // seconds
		seconds,
		inter = setInterval(() => {
			seconds = parseInt(timer % 60, 10);
			gameBoardTitle.textContent = `Time Until Game Starts ${seconds} Seconds`;
			if (timer-- < 1) {
				gameBoardTitle.textContent =
					"Virus can appear at any moment, be ready!";
				clearInterval(inter);
			}
		}, 1000);
};

const startGame = (match, friend, foe) => {
	//match contains everything needed to set up scoreboard etc, use "opponent" as key for foe

	// round view
	roundsEl.classList.toggle("hide");
	//	scoreboard view
	scoreboardEl.classList.toggle("hide");
	// hide start view
	startPageEl.classList.add("hide");

	// show game view
	appEl.classList.remove("hide");

	// increment rounds
	match.rounds++;

	// create new li element
	const liEl = document.createElement("div");

	// add class of scoreinfo to li
	liEl.classList.add("scoreinfo", "scoreboard-list");

	// set content of li
	// liEl.innerHTML = `<span class="friend">${friend}</span>
	// <span class="foe">${foe}</span>`;

	// append li to ul
	// scoreboardEl.appendChild(liEl);

	// Round Timer
	newRoundTimer();
};

//New round received, start new round with new virus!
socket.on("game:newround", (randomNumber) => {
	addVirus(randomNumber);
	console.log("Started new round and added number");
});

//See how the round went!
socket.on("game:roundresult", (game) => {
	const rounds =
		game.rounds.length < 10 ? game.rounds.length + 1 : game.rounds.length;
	//opponent for your opponent, use game[player] to get your own name,id,wins,fastestTime, game[opponent] for same but the enemy
	const player = opponent === "player1" ? "player2" : "player1";

	// roundsEl.innerHTML = "Round: " + rounds + "/10";

	// create new li element
	const liEl = document.createElement("li");
	// add class of scoreinfo to li
	liEl.classList.add("scoreinfo");

	if (game[player].latestTime < game[opponent].latestTime) {
		liEl.innerHTML = `<div class="round-wrapper winner">
        <p class="winner-title">Winner:
        <span class="winner-name">${game[player].name}</span><br>
        <p class="reaction">Reaction times</p>
        <span class="player-name">${game[player].name}: </span>
        <span class="player-time">${
			Math.floor(game[player].latestTime) / 1000
		}</span>
        <span class="opponent-name">${game[opponent].name}: </span>
        <span class="opponent-time">${
			Math.floor(game[opponent].latestTime) / 1000
		}</span>
        </div>`;

		scoreboardEl.appendChild(liEl);
	} else if (game[opponent].latestTime < game[player].latestTime) {
		liEl.innerHTML = `<div class="round-wrapper loser">
        <p class="winner-title">Winner:
        <span class="winner-name">${game[opponent].name}</span><br>
        <p class="reaction">Reaction times</p>
        <span class="player-name">${game[player].name}: </span>
        <span class="player-time">${
			Math.floor(game[player].latestTime) / 1000
		}</span>
        <span class="opponent-name">${game[opponent].name}: </span>
        <span class="opponent-time">${
			Math.floor(game[opponent].latestTime) / 1000
		}s</span>
        </div>`;

		scoreboardEl.appendChild(liEl);
	}

	//Game rounds contains a list of who the player is in each round (player1 or player2), who lost, and the time on each

	// time spent on cllick
	const player_you = game[player].fastestTime,
		player_opponent = game[opponent].fastestTime;

	// check which person won and lose
	if (game.rounds[game.rounds.length - 1].winner === player) {
		gameBoardTitle.textContent = `Win: ${
			Math.floor(player_opponent - player_you) / 1000
		} Seconds`;
		setTimeout(newRoundTimer, 800);
	} else if (game.rounds[game.rounds.length - 1].loser === player) {
		gameBoardTitle.textContent = `Lose: ${
			Math.floor(player_you - player_opponent) / 1000
		} Seconds`;
		setTimeout(newRoundTimer, 800);
	}
});

//All 10 rounds done, end game
socket.on("game:end", (game) => {
	alert("Game ended!");
	console.log(game);

	const rematchEl = document.createElement("button");
	const lobbyEl = document.createElement("button");

	rematchEl.classList.add("rematch");
	lobbyEl.classList.add("lobby");

	rematchEl.innerHTML = "Rematch";
	lobbyEl.innerHTML = "Go To Lobby";

	scoreboardWrapperEl.append(rematchEl);
	scoreboardWrapperEl.append(lobbyEl);

	scoreboardWrapperEl.append(rematchEl);
	scoreboardWrapperEl.append(lobbyEl);
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

	if (!isSearching) {
		// emit `user:joined` event and when we get acknowledgement, THEN show the chat
		socket.emit("user:findmatch", username, (status) => {
			// we've received acknowledgement from the server
			console.log("Server acknowledged that user joined", status);

			if (status.success) {
				isSearching = true;
				console.log(status);
				activeRoom = status.partner ? status.partner?.room : null;
				console.log("ACTIVE ROOM: --- " + activeRoom);

				if (activeRoom) {
					//Found match already, someone was waiting
					//startGame(status.partner.username);  //Partially Replaced by game:start

					console.log("active room: " + activeRoom);
				} else {
					const createElImg = document.createElement("img");

					// timer props
					let minuts,
						seconds,
						hours,
						total = 0;

					// timer logic + adding to page
					const setTime = () => {
						total++;
						seconds = getZero(total % 60);
						minuts = getZero(parseInt(total / 60));
						hours = getZero(parseInt(total / 60 / 60));
						startPageLobbyTimerEl.textContent = `${hours}:${minuts}:${seconds}`;
					};
					// call function every seconds
					setInterval(setTime, 1000);

					// get zero if number 9 or less
					const getZero = (num) => {
						if (num >= 0 && num < 10) return "0" + num;
						else return num;
					};

					// Change  Text for Title and Button
					document.querySelector(".start-page__title").textContent =
						"Lobby status 1/2";
					document.querySelector(".mr-5").textContent =
						"Please wait for second player";

					// Loading spinner Proportions and apply to button
					createElImg.src = "../assets/icons/spinner.gif";
					createElImg.classList.add("d-block");
					createElImg.width = 40;
					startSearchingEl.appendChild(createElImg);
				}
			}
		});
	} else {
		//Is currently searching and wants to cancel matchmaking!

		socket.emit("user:cancelmatching", (status) => {
			//No errors and has been removed successfully
			if (status.success && status.hasRemoved) {
				//Update variable isSearching to false, for next time.
				isSearching = false;
				//Replace HTML to remove spinner etc
				startSearchingEl.innerHTML =
					'<div class="mr-3 btn-search">Start Searching</div>';
				//clear timeout
				const highestTimeoutId = setTimeout(";");
				for (var i = 0; i < highestTimeoutId; i++) {
					clearTimeout(i);
				}
				//Set timer to 0
				startPageLobbyTimerEl.textContent = `00:00:00`;
			}
		});
	}
});
