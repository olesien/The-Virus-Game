const socket = io();
const messageForm = document.querySelector("#message-form"); //username form
const startPageEl = document.querySelector(".start-page");
const appEl = document.querySelector("#app");
const gridBoxes = document.querySelectorAll(".grid-box");

let activeRoom = null;
let username = null;

// get random number between 1-64
const getRandomNumber = () => {
	return Math.ceil(Math.random() * 64);
}

// add virus to random grid box
const addVirus = () => {
	let randomNumber = getRandomNumber();
	gridBoxes[randomNumber].classList.add('virus');
}

addVirus();

const startGame = (username) => {
	console.log(username);
	// hide start view
	startPageEl.classList.add("hide");

	// show chat view
	appEl.classList.remove("hide");

	// add virus to gamestart later
	// addVirus();
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
				const createElImg = document.createElement('img'),
					startSearching = document.querySelector('.btn-success'),
					startPageLobbyTimer = document.querySelector('.start-page__lobby-timer');

				// timer props
				let minuts,
					seconds,
					hours,
					total = 0;


				// timer logic + adding to page
				const setTime = () => {
					++total;
					seconds = getZero(totalSeconds % 60);
					minuts = getZero(parseInt(totalSeconds / 60));
					hours = getZero(parseInt(totalSeconds / 60 / 60));
					startPageLobbyTimer.textContent = `${hours}:${minuts}:${seconds}`
				}

				// call function every seconds
				setInterval(setTime, 1000);

				// get zero if number 9 or less
				const getZero = (num) =>{
					if (num >= 0 && num < 10) return '0' + num;
					else return num;
				}

				// Change  Text for Title and Button
				document.querySelector('.start-page__enter-your-name-title').textContent = 'Lobby status 1/2';
				document.querySelector('.btn-search').textContent = 'Please wait for second player';


				// Loading spinner Proportions and apply to button
				createElImg.src = '../assets/icons/spinner.gif';
				createElImg.classList.add('d-block')
				createElImg.width = 40;
				startSearching.appendChild(createElImg)
			}
		}
	});
});
