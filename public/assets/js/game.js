const socket = io();
const messageForm = document.querySelector("#message-form"); //username form
const startPageEl = document.querySelector(".start-page");
const appEl = document.querySelector("#app");

let activeRoom = null;
let username = null;

const startGame = (username) => {
	console.log(username);
	// hide start view
	startPageEl.classList.add("hide");

	// show chat view
	appEl.classList.remove("hide");
};

socket.on("user:foundmatch", (partner) => {
	console.log(partner);
	activeRoom = partner.room;
	console.log("active room: " + activeRoom);
	startGame(partner.username);
	// callback({
	// 	success: true,
	// });
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
				startGame(status.partner.username);

				console.log("active room: " + activeRoom);
			} else {
				//display spinner for loading for user
			}
		}
	});
});
