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

const buildGameFeed = (prevgames, livegames) => {};
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
