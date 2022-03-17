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
	gridBoxes[randomNumber].classList.add("virus");
};

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
				//display spinner for loading for user
			}
		}
	});
});
