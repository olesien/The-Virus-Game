const socket = io();
const messageForm = document.querySelector("#message-form"); //username form
const startPageEl = document.querySelector(".start-page");
const appEl = document.querySelector("#app");
const gridBoxes = document.querySelectorAll(".grid-box");

let activeRoom = null;
let username = null;

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
	let timer = 4, // seconds
		seconds,
		gameBoardTitle = document.querySelector("#gameboard-title"),
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

	// hide start view
	startPageEl.classList.add("hide");

	// show chat view
	appEl.classList.remove("hide");

	// Round Timer
	newRoundTimer();
	// add virus to gamestart later
	// addVirus();
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

	//Game rounds contains a list of who the player is in each round (player1 or player2), who lost, and the time on each
	console.log(game.rounds);
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

			if (activeRoom) {
				//Found match already, someone was waiting
				//startGame(status.partner.username);  //Partially Replaced by game:start

				console.log("active room: " + activeRoom);
			} else {
				const createElImg = document.createElement("img"),
					startSearching = document.querySelector(".btn-success"),
					startPageLobbyTimer = document.querySelector(
						".start-page__lobby-timer"
					);

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
					startPageLobbyTimer.textContent = `${hours}:${minuts}:${seconds}`;
				};
				// call function every seconds
				setInterval(setTime, 1000);

				// get zero if number 9 or less
				const getZero = (num) => {
					if (num >= 0 && num < 10) return "0" + num;
					else return num;
				};

				// Change  Text for Title and Button
				document.querySelector(
					".start-page__enter-your-name-title"
				).textContent = "Lobby status 1/2";
				document.querySelector(".btn-search").textContent =
					"Please wait for second player";

				// Loading spinner Proportions and apply to button
				createElImg.src = "../assets/icons/spinner.gif";
				createElImg.classList.add("d-block");
				createElImg.width = 40;
				startSearching.appendChild(createElImg);
			}
		}
	});
});
