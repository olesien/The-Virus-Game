const previousGamesPage = document.querySelector(".previous-games-page"),
	btnPreviousGames = document.querySelector(
		".start-page__btn-previous-games"
	),
	startPage = document.querySelector(".start-page"),
	mainWindowBarLink = document.querySelector(".main-window__bar-link"),
	mainWindowBackButton1 = document.querySelector(
		".main-window__back-button-1"
	),
	mainWindowBackButton2 = document.querySelector(
		".main-window__back-button-2"
	),
	startPageBtnFastestReaction = document.querySelector(
		".start-page__btn-fastest-reaction"
	),
	fastestReactionPage = document.querySelector(".fastest-reaction-page");

const buildGameFeed = (prevgames, livegames) => {
	//The idea here is to use previous games (last 10 from db) alongside livegames to build a feed.
	//This feed updates every time a round is completed and whenever the user loads in recent games
	//prevgames
	// [{gameId: "game-2341412213",
	//     player1: {
	//         name: "somename",
	//         id: "23414122131",
	//         wins: 1,
	//         fastestTime: 1
	//     },
	//     player2: {
	//         name: "othername",
	//         id: "424214114",
	//         wins: 2,
	//         fastestTime: 0.9
	//     },
	// winner: "player1",
	// loser: "player2",
	// Timestamp: 53252351, <- this is Date.now()
	// rounds: [
	// 	{
	// 		winner: "player1",
	// 		winnerTime: 0.7,
	// 		loser: "player2",
	// 		loserTime: 0.5,
	// 	},
	// ]}]
	console.log(prevgames);

	//livegames
	// {"game-2341412213": {
	//     startRoundTime: 213131
	//     player1: {
	//         name: "somename",
	//         id: "23414122131",
	//         wins: 1,
	//         fastestTime: 1
	//     },
	//     player2: {
	//         name: "othername",
	//         id: "424214114",
	//         wins: 2,
	//         fastestTime: 0.9
	//     },
	//     rounds: [
	//         {
	//             winner: "player1",
	//             winnerTime: 1.2,
	//             loser: "player2",
	//             loserTime: 1.3,
	//         },
	//         {
	//             winner: "player1",
	//             winnerTime: 1.3,
	//             loser: "player2",
	//             loserTime: 1.5,
	//         }
	//     ]
	// }}
	console.log(livegames);
};
// show Prev Games window
const showPrevGames = () => {
	mainWindowBarLink.textContent = "https://thevirusgame.com/previousgames";
	previousGamesPage.classList.toggle("hide");
	startPage.classList.toggle("hide");
	mainWindowBackButton1.classList.toggle("hide");

	//Here I want to select last 10 games from db
	socket.emit("user:prevgames", (status) => {
		if (status.success) {
			//Last 10 games played
			console.log(status.prevgames);
			//All currently active games. Iterate through but cap at 10?
			console.log(status.livegames);

			//Send to build function
			buildGameFeed(status.prevgames, status.livegames);
		} else {
			alert("Error when fetching data. See console for details");
			console.log(status.error);
		}
	});
};

socket.on("game:updatePrevGames", (status) => {
	console.log(status);
	if (status.success) {
		//Send to build function
		buildGameFeed(status.prevgames, status.livegames);
	} else {
		alert("Error when fetching data. See console for details");
		console.log(status.error);
	}
});

// show Leaderboard/Fastest Reaction window
const showLeaderboard = () => {
	mainWindowBarLink.textContent = "https://thevirusgame.com/leaderboard";
	fastestReactionPage.classList.toggle("hide");
	startPage.classList.toggle("hide");
	mainWindowBackButton2.classList.toggle("hide");
};

// Back to Start page function
const backButton = (btn, page) => {
	btn.addEventListener("click", (e) => {
		e.target.classList.toggle("hide");
		mainWindowBarLink.textContent = "https://thevirusgame.com";
		page.classList.toggle("hide");
		startPage.classList.toggle("hide");
	});
};

// call two different back buttons
backButton(mainWindowBackButton1, previousGamesPage);
backButton(mainWindowBackButton2, fastestReactionPage);

// Event Listeners
startPageBtnFastestReaction.addEventListener("click", () => showLeaderboard());
btnPreviousGames.addEventListener("click", () => showPrevGames());
