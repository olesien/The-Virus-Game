"use strict";

const startPageAsidePreviousGames = document.querySelector('.start-page__aside-previous-games'),
	tartPageAsideFastestReaction = document.querySelector('.start-page__aside-fastest-reaction'),
	previousGamesButton = document.querySelector('.previous-games__btn'),
	fastestReactionButton = document.querySelector('.fastest-reaction__btn');


const toogleFun = (elem, btn) => {
	btn.addEventListener('click', () => {
		elem.classList.toggle('hide');
	})
};

toogleFun(startPageAsidePreviousGames, previousGamesButton);
toogleFun(tartPageAsideFastestReaction, fastestReactionButton)
