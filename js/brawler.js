"use strict"; 

var app = app || {}; 

app.brawler = {

debugging: false,
ctx : undefined, 
canvas : undefined, 

gameTime : 0,
updateTime: 0, 
player : undefined,
finger : undefined,
enemies : [],
lastTime : 0,
lastGameTime: 0,

enemyHitTime: 0, 
playerHitTime: 0,
fingerCrushTime: 0,
glowSize: 50,

soundEffectVolume : .1, 
soundtrackVolume : .4,

highScores : [150,120,90,60,30],

gameOverMessage : 0,

appsDefeated : 0,
score : 0,

enemyHealth: 3,
fingerCooldown: 5,
playerPower: 200,

displayInstructions: true,

GameStates : {
	splashScreen : "SPLASH_STATE",
	menu : "MENU_STATE",
	game : "GAME_STATE",
	gameover : "GAME_OVER_STATE",
	paused : "PAUSE",
	scores: "SCORES",
	about: "ABOUT",
	instructions: "INSTRUCTIONS",
},

gameState : undefined,

// The main game loop
loop : function() {
    var now = Date.now();
    var dt = (now - app.brawler.lastTime) / 1000.0;
	if(dt > .3) { dt = 0;} 
	
	app.brawler.lastGameTime = app.brawler.gameTime; 
    app.brawler.update(dt);
    app.brawler.draw(app.brawler.ctx);

    app.brawler.lastTime = now;
    app.animationID = requestAnimationFrame(this.loop.bind(this));
},

// Reset game to original state
reset:function() {
    app.brawler.gameTime = 0;
	app.brawler.score = 0; 
	app.brawler.appsDefeated = 0; 
	app.brawler.enemies = []; 
	
	app.brawler.enemyHealth = 3,
	app.brawler.fingerCooldown = 5,
	app.brawler.playerPower = 200,
	
	//function Player(pos, size, coll_Rect, speed)
	app.brawler.player = new app.Player(); 
	app.brawler.player.init();
	
	app.brawler.finger = new app.Finger(50); 
},

init:function() {
    app.brawler.lastTime = Date.now();
	
	// Create the canvas
	app.brawler.canvas = document.querySelector('canvas');
	app.brawler.ctx = app.brawler.canvas.getContext("2d");
	app.brawler.canvas.width = 1200;
	app.brawler.canvas.height = 600;
	
	app.brawler.reset();
	app.brawler.gameState = app.brawler.GameStates.menu;
	
	app.brawler.setupUI(); 
	
	//localStorage.setItem("score" +3, 9999); 
	//localStorage.clear(); 
	//if there is no local storage
	if(localStorage.getItem("score0") === null) {
		//set all localStorage high scores to 0
		for(var i = 0; i < app.brawler.highScores.length; i++)
		{
			localStorage.setItem('score'+i, app.brawler.highScores[i]); 
		}
	}
	//set high scores to local storage
	for(var i = 0; i < app.brawler.highScores.length; i++)
	{
		app.brawler.highScores[i] = localStorage.getItem('score'+i); 
		//console.log(app.brawler.highScores[i]); 
	}
	if(localStorage.getItem("playedBefore") === null) {
		localStorage.setItem("playedBefore",true); 
	}
	else{ app.brawler.displayInstructions = false; } 
	
    app.brawler.loop();
},

// Update game objects
update : function(dt) {
	
	switch(app.brawler.gameState)
	{
		case "GAME_STATE": 
			app.brawler.gameTime += dt;
			app.brawler.updateInput(dt);
			
			app.brawler.finger.update(dt); 
			
			app.brawler.player.update(dt);
			
			for(var i = app.brawler.enemies.length -1; i >= 0 ; i--){
				if(app.brawler.enemies[i].active)
				{
					app.brawler.enemies[i].update(dt);
				}
				else
				{
					app.brawler.enemies.splice(i, 1);
				}
			}
			
			app.brawler.checkCollisions(dt); 
			break; 
		case "GAME_OVER_STATE": 
			break; 
		case "PAUSE": 
			break; 
	}
	
},
//updates input
updateInput: function(dt) {
	var player = app.brawler.player; 
	var noInput = true;
	var leftDown = false; 
	var rightDown = false; 
	
    if(input.isDown('LEFT')) {
		if(player.animState == "BLOCK_STATE" )
		{
			player.roll(dt,'left'); 
			noInput = false; 
		}
		if(player.animState == "IDLE_STATE" || player.animState=='RUN_STATE')
		{
			player.facingRight = false;
			player.move(dt); 
			noInput = false; 
		}
    }
    else if(input.isDown('RIGHT')) {
        if(player.animState == "BLOCK_STATE")
		{
			player.roll(dt,'right'); 
			noInput = false; 
		}
		if(player.animState == "IDLE_STATE" || player.animState=='RUN_STATE')
		{
			player.facingRight = true;
			player.move(dt); 
			noInput = false; 
		} 
    }
	if(input.isDown('z')){
		if(player.animState != "ROLL_STATE" && player.animState != "RUN_STATE")
		{
			player.block(); 
			noInput = false; 
		}
	}
	if(input.isDown('x')){
		if(player.animState != "RUN_STATE" )
		{
			player.attack(dt); 
			noInput = false; 
		}
	}
	
	if(noInput && player.animState!="ROLL_STATE" && player.animState!="ATTACK_STATE")
	{
		player.animState = player.AnimStates.idle; 
	}
	
	if(input.isDown('p')){
		app.brawler.debugging = !app.brawler.debugging; 
	}
	
	app.brawler.player = player; 
},

// Collisions
checkCollisions:function(dt) {
	//constrain player to stage
    app.brawler.checkPlayerBounds();
	
	var player = app.brawler.player; 
	//for all of the enemies
	for(var i = 0; i < app.brawler.enemies.length; i++)
	{
		var enemy = app.brawler.enemies[i]; 
		app.brawler.enemyHitTime += dt; 
		//if the enemy is attacking, check to see if it hits the player
		if(enemy.attacking)
		{
			if(app.brawler.rectCollisionTest(enemy.attack_Rect,player.coll_Rect))
			{
				//if the last enemy hit occured less than the .3 seconds ago
				
				if(app.brawler.enemyHitTime > enemy.attackTime)
				{
					if(player.pos[0] > enemy.pos[0])
					{
						//console.log('enemy ' + i + ' hit player from left'); 
						player.hit(1); 
					}
					else
					{
						//console.log('enemy ' + i + ' hit player from right'); 
						app.brawler.player.hit(-1); 
					}
					app.brawler.enemyHitTime = 0; 
				}
			}
		}
		
		app.brawler.playerHitTime += dt;
		//if the player is attacking, see if they hit any enemies
		if(player.animState == player.AnimStates.attacking)
		{
			
			if(app.brawler.rectCollisionTest(player.attack_Rect,enemy.coll_Rect))
			{
				if(app.brawler.playerHitTime > player.attackTime)
				{
					if(player.pos[0] > enemy.pos[0])
					{
						//console.log('Player hit enemy ' + i + ' from the right'); 
						enemy.hit(-1,player.power); 
					}
					else
					{
						//console.log('Player hit enemy ' + i + ' from the left'); 
						enemy.hit(1,player.power);
					}
					app.brawler.playerHitTime = 0; 
				}
			}
		}
	}//end for loop
	
	app.brawler.fingerCrushTime += dt; 
	var finger = app.brawler.finger; 
	//check finger collision
	if(finger.behavior == 'TAP' && !finger.downPosition && app.brawler.rectCollisionTest(finger.coll_Rect, player.coll_Rect) && app.brawler.fingerCrushTime > 1.5)
	{
		//console.log('FINGER CRUSHED PLAYER Finger Y: ' + finger.pos[1]); 
		app.brawler.fingerCrushTime = 0; 
		app.brawler.gameOver("You were crushed by THE FINGER!"); 
		finger.pos[1] = finger.tapHeight; 
	}
},
//checks to see if two rectangles collide
rectCollisionTest:function(r1,r2) {
  return !(r2[0] > r1[0] + r1[2] || 
           r2[0]+ r2[2] < r1[0] || 
           r2[1] > r1[1] + r1[3] ||
           r2[1] + r2[3] < r1[1]);
},

//checks to see if player is on stage
checkPlayerBounds:function() {
	var player = app.brawler.player; 
	
	if(player.coll_Rect[0] < 0)
	{
		player.pos[0] = 0 - player.collRectOffset[0]; 
	}
	if(player.coll_Rect[0] + player.coll_Rect[2] > app.brawler.canvas.width)
	{
		player.pos[0] = app.brawler.canvas.width - player.collRectOffset[0] - player.coll_Rect[2]; 
	}
	
	player.updateCollRects(); 
	
	app.brawler.player = player; 
},

// Draw everything
draw:function(ctx) {

	app.brawler.ctx.fillStyle = 'black';
	if(app.brawler.debugging) { app.brawler.ctx.fillStyle = 'white'; }
	app.brawler.ctx.fillRect(0, 0, app.brawler.canvas.width, app.brawler.canvas.height);
			
	switch(app.brawler.gameState)
	{
		case "MENU_STATE": 
			document.getElementById('playButton').style.display = 'block'; 
			document.getElementById('scoresButton').style.display = 'block'; 
			document.getElementById('aboutButton').style.display = 'block'; 
			
			var titleScreen = resources.get("img/titleScreen.png");
			ctx.drawImage(titleScreen, 0, 0 , 1200, 600); 
			break; 
		case "SCORES":
			ctx.font = '85px virtualDj';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.fillText("High Scores", app.brawler.canvas.width/2,75);
			ctx.strokeStyle = '#11b500';
			ctx.lineWidth = 3; 
			ctx.strokeText("High Scores", app.brawler.canvas.width/2,75);
			ctx.font = '50px virtualDj';
			for(var i = 0; i < app.brawler.highScores.length; i++)
			{
				if(i == 0) { ctx.fillStyle = 'yellow'; } else { ctx.fillStyle = 'white'; }
				ctx.textAlign = 'Left';
				ctx.fillText(i+ 1 +". " +app.brawler.highScores[i], 240,60 * i + 180);
			}
			document.getElementById('menuButton').style.display = 'block';
			break; 
		case "ABOUT":
			ctx.font = '85px virtualDj';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.fillText("About", app.brawler.canvas.width/2,75);
			ctx.strokeStyle = '#11b500';
			ctx.lineWidth = 3; 
			ctx.strokeText("About", app.brawler.canvas.width/2,75);
			ctx.font = '50px virtualDj';
			document.getElementById('menuButton').style.display = 'block';
			document.getElementById('aboutParagraph').style.display = 'block';
			break;
			
		case "GAME_STATE":
			app.brawler.drawGameScene(ctx); 
			
			break; 
		case "GAME_OVER_STATE": 
			app.brawler.drawGameScene(ctx); 
			
			ctx.save(); 
			ctx.globalAlpha=0.6;
			ctx.fillStyle="red"; 
			ctx.fillRect(0,0,app.brawler.canvas.width,app.brawler.canvas.height);
			ctx.restore(); 
			
			ctx.font = '100px virtualDj';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 3; 
			ctx.fillText  ("GAME OVER", app.brawler.canvas.width /2, app.brawler.canvas.height /2 - 60);
			ctx.strokeText  ("GAME OVER", app.brawler.canvas.width /2, app.brawler.canvas.height /2 - 60);
			ctx.font = '40px virtualDj';
			ctx.lineWidth = 1; 
			ctx.fillText  (app.brawler.gameOverMessage, app.brawler.canvas.width /2, app.brawler.canvas.height /2 + 20);
			ctx.strokeText  (app.brawler.gameOverMessage, app.brawler.canvas.width /2, app.brawler.canvas.height /2 + 20);
			ctx.fillText  ("Score: " + app.brawler.score, app.brawler.canvas.width /2, app.brawler.canvas.height /2 + 80);
			ctx.strokeText  ("Score: " + app.brawler.score, app.brawler.canvas.width /2, app.brawler.canvas.height /2 + 80);
			
			document.getElementById('restartButton').style.display = 'block'; 
			document.getElementById('menuButton').style.display = 'block'; 
			
			break; 
		case "PAUSE":
			app.brawler.drawGameScene(ctx); 
			ctx.save(); 
			ctx.globalAlpha=0.4;
			ctx.fillStyle="black"; 
			ctx.fillRect(0,0,app.brawler.canvas.width,app.brawler.canvas.height);
			ctx.restore(); 
			
			ctx.font = '80px virtualDj';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.fillText  ('Paused', app.brawler.canvas.width /2 , app.brawler.canvas.height /2 );
			
			break;
		
		case "INSTRUCTIONS":
			var instructions = resources.get("img/instructionScreen.png");
			ctx.drawImage(instructions, 0, 0 , 1200, 600); 
			document.body.onclick = function(){
				if(app.brawler.gameState == app.brawler.GameStates.instructions)
				{
					app.brawler.gameState = app.brawler.GameStates.game; 
					app.brawler.reset();
				}
			}
			break; 
	}

},
//draws everything the game screen uses
drawGameScene:function(ctx){
	if(!app.brawler.debugging)
	{
		var flannelBG = resources.get("img/flannelBG.png");
		ctx.drawImage(flannelBG, 0, 0 , 1200, 600); 
	}
	
	//draw hud
	ctx.font = '40px virtualDj';
	ctx.fillStyle = 'white';
	ctx.textAlign = 'left';
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 1; 
	ctx.fillText  ("Apps Defeated: " + app.brawler.appsDefeated, 520, 60);
	ctx.strokeText("Apps Defeated: " + app.brawler.appsDefeated, 520, 60);
	ctx.fillText  ("Score: " + app.brawler.score, 520, 120);
	ctx.strokeText  ("Score: " + app.brawler.score, 520, 120);
	
	//draw enemies
	for(var i=0; i < app.brawler.enemies.length; i++)
	{
		app.brawler.enemies[i].draw(ctx); 
	}
	//draw player
	app.brawler.player.draw(ctx); 
	//draw finger
	app.brawler.finger.draw(ctx); 
	
	//draw phone platform
	var phoneBG = resources.get("img/phoneBG.png");
	ctx.save(); 
	ctx.shadowBlur = app.brawler.glowSize; 
	ctx.shadowColor = '#99FFFF'; 
	ctx.fillRect(0,app.brawler.canvas.height - 72, 1200,72);
	ctx.restore(); 
	ctx.drawImage(phoneBG, 0, app.brawler.canvas.height - 72, 1200, 72); 
},

// Game over
gameOver:function(message) {
	app.brawler.gameState = app.brawler.GameStates.gameover; 
	app.brawler.gameOverMessage = message; 
	app.brawler.insertHighScore(app.brawler.score); 
},
//sets up event listeners for html buttons
setupUI:function() {
	var playButton = document.getElementById("playButton");
	var scoresButton = document.getElementById("scoresButton"); 
	var aboutButton = document.getElementById("aboutButton"); 
	var menuButton = document.getElementById("menuButton"); 
	var restartButton = document.getElementById("restartButton"); 
	var soundButton = document.getElementById("soundButton"); 
	
	playButton.onclick = function() { 
		if(app.brawler.displayInstructions)
		{
			app.brawler.gameState = app.brawler.GameStates.instructions;
		}
		else { app.brawler.gameState = app.brawler.GameStates.game; app.brawler.reset(); }
		
		playButton.style.display = 'none';
		scoresButton.style.display = 'none';
		aboutButton.style.display = 'none';
	}
	scoresButton.onclick = function() { 
		app.brawler.gameState = app.brawler.GameStates.scores; 
		playButton.style.display = 'none';
		scoresButton.style.display = 'none';
		aboutButton.style.display = 'none';
	}
	aboutButton.onclick = function() { 
		app.brawler.gameState = app.brawler.GameStates.about; 
		playButton.style.display = 'none';
		scoresButton.style.display = 'none';
		aboutButton.style.display = 'none';
	}
	menuButton.onclick = function() { 
		app.brawler.gameState = app.brawler.GameStates.menu; 
		menuButton.style.display = 'none';
		restartButton.style.display = 'none';
		document.getElementById("aboutParagraph").style.display = 'none'; 
	}
	restartButton.onclick = function() { 
		app.brawler.gameState = app.brawler.GameStates.game; 
		app.brawler.reset(); 
		menuButton.style.display = 'none';
		restartButton.style.display = 'none';
	}
	soundButton.onclick = function(){
		var soundButtonImage = document.getElementById("soundButtonImage"); 
		if(app.brawler.soundEffectVolume > 0)
		{
			createjs.Sound.stop(); 
			app.brawler.soundEffectVolume = 0; 
			app.brawler.soundtrackVolume = 0; 
			soundButtonImage.src = 'img/soundOff.png'; 
		}
		else
		{
			app.brawler.soundEffectVolume = .1; 
			app.brawler.soundtrackVolume = .4; 
			app.brawler.startSoundtrack(); 
			soundButtonImage.src = 'img/soundOn.png'; 
		}
	}
},
//starts soundtrack
startSoundtrack:function(){
	createjs.Sound.stop(); 
	createjs.Sound.play("soundtrack",{loop:-1, volume: app.brawler.soundtrackVolume}); 
},
//adds high score to array if it is higher than one of the existing scores
insertHighScore:function(score){
	var prev = score; 
	for(var i = 0; i < 5; i++){
		if(score > app.brawler.highScores[i])
		{
			var temp = app.brawler.highScores[i];
			app.brawler.highScores[i] = prev; 
			localStorage.setItem("score"+i, prev); 
			prev = temp; 
		}
	}
},
//adds to the game's difficulty over time (and gives player more power to launch enemies)
enhanceDifficulty:function(){
	app.brawler.enemyHealth ++;
	app.brawler.fingerCooldown -= 1;
	if(app.brawler.fingerCooldown <= 0){ app.brawler.fingerCooldown = 0; }
	app.brawler.playerPower += 50;
	
	//console.log("New fingerCooldown: " + app.brawler.fingerCooldown); 
	//console.log("New enemyHealth: " + app.brawler.enemyHealth); 
	//console.log("New playerPower: " + app.brawler.playerPower); 
},


}; 