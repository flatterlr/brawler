"use strict"

var app = app || {}; 

app.animationID = undefined;
app.previousState = undefined; 

window.onload = function() {
	//console.log("page loaded"); 
	
	createjs.Sound.alternateExtensions = ["mp3"]; 
	createjs.Sound.registerSound({id:"enemyAttack", src:"sounds/enemyAttack.wav"}); 
	createjs.Sound.registerSound({id:"enemySpawn", src:"sounds/enemySpawn.wav"}); 
	createjs.Sound.registerSound({id:"playerAttack", src:"sounds/playerAttack.wav"}); 
	createjs.Sound.registerSound({id:"playerHit", src:"sounds/playerHit.wav"}); 
	createjs.Sound.registerSound({id:"soundtrack", src:"sounds/soundtrack.ogg"}); 
	
	createjs.Sound.addEventListener("fileload", handleFileLoad); 
	
	function handleFileLoad(e){
		//console.log("Preloaded sound: ", e.id, e.src); 
		if(e.src == "sounds/soundtrack.ogg") {
			app.brawler.startSoundtrack();
		}
	}
	
	resources.load([
		'img/titleScreen.png',
		'img/instructionScreen.png',
		'img/soundOff.png',
		'img/soundOn.png',
		'img/finger.png',
		'img/phoneBG.png',
		'img/playerSheet.png',
		'img/enemySheet.png',
		'img/flannelBG.png',
		'img/heart.png',
		'img/poofDeath.png',
	]); 
	resources.onReady(app.brawler.init); 
	resizeGame(); 
	
	window.addEventListener('resize', resizeGame, false);
	
	window.onblur = function(){
		app.previousState = app.brawler.gameState; 
		app.brawler.gameState = "PAUSE";
		cancelAnimationFrame(app.animationID);
		app.keydown = []; // clear key daemon
		createjs.Sound.stop(); 
		// call update() so that our paused screen gets drawn
		app.brawler.loop();
	};
	
	window.onfocus = function(){
		app.brawler.gameState = app.previousState;
		cancelAnimationFrame(app.animationID);
		app.brawler.startSoundtrack(); 
		// start the animation back up
		app.brawler.loop();
	};
}

function resizeGame() {
    var gameArea = document.getElementById('gameArea');
    var widthToHeight = 2 / 1;
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;
    var newWidthToHeight = newWidth / newHeight;
    
    if (newWidthToHeight > widthToHeight) {
        newWidth = newHeight * widthToHeight;
        gameArea.style.height = newHeight + 'px';
        gameArea.style.width = newWidth + 'px';
    } else {
        newHeight = newWidth / widthToHeight;
        gameArea.style.width = newWidth + 'px';
        gameArea.style.height = newHeight + 'px';
    }
    
    gameArea.style.marginTop = (-newHeight / 2) + 'px';
    gameArea.style.marginLeft = (-newWidth / 2) + 'px';
	
	gameArea.style.fontSize = (newWidth / 800) + 'em';
}