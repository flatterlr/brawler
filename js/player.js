"use strict"; 

var app = app || {}; 

app.Player = function(){

		function Player() {
			this.size = [160,128]; 
			this.coll_Rect = [0,0,50,100]; 
			this.collRectOffset = [50,30]; 
			this.pos = [app.brawler.canvas.width/2, app.brawler.canvas.height- this.coll_Rect[3] - this.collRectOffset[1] -68]; 
			
			this.speed = 600; 
			this.sprite = undefined; 
			this.facingRight = true; 

			this.rollSpeed = 800; 
			this.rollTime = .38; 
			this.rollTimer = this.rollTime; 
			this.rollCooldownTimer = this.rollTime/2; 
			this.canRoll = true; 
			
			this.attackTime = .2; 
			this.attackTimer = this.attackTime; 
			this.canAttack = true; 
			
			this.invulnerable = false; 
			this.invulnerableTimer = 3; 
			
			this.attack_Rect = [0,50,50,100]; 
			this.attackRectOffset = [0,30]; 
			
			this.blink = false; 
			this.blinkCount = 0; 
			
			this.power = app.brawler.playerPower;
			
			this.heartImage = resources.get("img/heart.png");
			this.hearts = [true,true,true]; 
			this.numHearts = 3; 
			
			this.AnimStates = {
				idle : "IDLE_STATE",
				running : "RUN_STATE",
				rolling : "ROLL_STATE", 
				blocking : "BLOCK_STATE",
				attacking : "ATTACK_STATE",
				hit : "HIT",
			}; 
			
			this.animState = this.AnimStates.idle; 
			
			this.debugStroke = this.debugStroke; 
		};

		Player.prototype = {
			//updates player
			update: function(dt) {
				this.updateAnim(dt); 
				this.updateCollRects(); 
				this.sprite.update(dt); 
				this.sprite.parentPos = this.pos; 
				//console.log(this.facingRight);
			},
			//draws player
			draw: function(ctx) {
				if(!this.blink)
				{
					this.sprite.draw(ctx); 
				}
				
				for(var i = 0; i < this.hearts.length; i++)
				{
					ctx.save(); 
					if(!this.hearts[i])
					{
						ctx.globalAlpha = .3;
					}
					ctx.drawImage(this.heartImage, 150 * i + 40, 20 , 132, 112); 
					ctx.restore(); 
				}
				
				if(app.brawler.debugging)
				{
					//draw Debug collision rectangle
					ctx.beginPath();
					ctx.rect(this.coll_Rect[0], this.coll_Rect[1], this.coll_Rect[2], this.coll_Rect[3]);
					ctx.lineWidth = 2;
					ctx.strokeStyle = 'green';
					ctx.stroke();
					//draw Debug attack rectangle
					if(this.animState == this.AnimStates.attacking)
					{
						ctx.beginPath(); 
						ctx.rect(this.attack_Rect[0], this.attack_Rect[1], this.attack_Rect[2], this.attack_Rect[3]);
						ctx.lineWidth = 2; 
						ctx.strokeStyle = 'green'; 
						ctx.stroke(); 
					}
				}
			},
			//loads player sprites
			load: function() {
				this.idleRightSprite = new app.Sprite('img/playerSheet.png',[0,0],this.pos,[this.size[0],this.size[1]],6,[0,1,2,3]);
				this.idleLeftSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]],this.pos,[this.size[0],this.size[1]],6,[0,1,2,3]);
				
				this.blockRightSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]*2],this.pos,[this.size[0],this.size[1]],6,[0,1,2,1]);
				this.blockLeftSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]*3],this.pos,[this.size[0],this.size[1]],6,[2,1,0,1]);
				
				this.runRightSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]*4],this.pos,[this.size[0],this.size[1]],12,[0,1,2,3,4,5,6,7]);
				this.runLeftSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]*5],this.pos,[this.size[0],this.size[1]],12,[0,1,2,3,4,5,6,7]);
				
				this.attackRightSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]*6],this.pos,[this.size[0],this.size[1]],28,[0,1,2,3]);
				this.attackLeftSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]*7],this.pos,[this.size[0],this.size[1]],28,[3,2,1,0]);
				
				this.rollRightSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]*8],this.pos,[this.size[0],this.size[1]],12,[1,2,3,4,5,6,0]);
				this.rollLeftSprite = new app.Sprite('img/playerSheet.png',[0,this.size[1]*9],this.pos,[this.size[0],this.size[1]],12,[5,4,3,2,1,0,6]);
			},
			
			init: function() {
				this.sprite = this.idleRightSprite; 
				
				this.load(); 
			},
			//moves the player
			move: function(dt){
				this.animState = this.AnimStates.running; 
				var dir = 1; 
				
				if(!this.facingRight){ dir = -1; } else{ dir = 1; }
				
				this.pos[0] += this.speed * dt * dir;

			},
			//player attack
			attack: function(dt){
				if(this.canAttack)
				{
					this.animState = this.AnimStates.attacking; 
					this.attackTimer -= dt;  
					
					createjs.Sound.play('playerAttack',{volume: app.brawler.soundEffectVolume});
					
					if(!this.facingRight){ this.facingRight = false; } else { this.facingRight = true; }
				
					if(this.attackTimer < 0)
					{ 
						this.attackTimer = this.attackTime; 
						this.animState = this.AnimStates.idle; 
						this.canAttack = false; 
					}
				}
			},
			//block
			block: function(){
				this.animState = this.AnimStates.blocking;
			},
			//roll
			roll: function(dt,dir){
				if(this.canRoll)
				{
					this.animState = this.AnimStates.rolling; 
					this.rollTimer -= dt; 
					
					if(dir == "left"){ dir = -1; this.facingRight = false; } else{ dir = 1; this.facingRight = true;}
					if(this.rollTimer > 0)
					{
						//this.facingRight = false; 
						this.pos[0] += this.rollSpeed * dt * dir; 
					}
					else
					{
						this.rollTimer = this.rollTime; 
						this.animState = this.AnimStates.blocking; 
						this.canRoll = false; 
					}
				}
			},
			//when player is hit
			hit: function(dir)
			{
				var hitLanded = true; 
				
				if(this.animState == 'BLOCK_STATE' || this.animState == 'ROLL_STATE')
				{
					hitLanded = false; 
					if(this.animState == 'BLOCK_STATE')
					{
						if(dir == 1 && this.facingRight) { hitLanded = true; }
						if(dir == -1 && !this.facingRight) { hitLanded = true; }
					}
				}
				if(this.invulnerable){ hitLanded = false; }
				
				if(hitLanded)
				{
					this.pos[0] += 50 * dir; 
					this.invulnerable = true; 
					
					createjs.Sound.play('playerHit',{volume: app.brawler.soundEffectVolume});
					
					this.numHearts --; 
					if(this.numHearts <= 0) { app.brawler.gameOver("You were slain by Apps!"); }
					this.hearts[this.numHearts] = false; 
				}
			},
			//timer to separate roll animations
			cooldownRoll : function(dt){
				this.rollCooldownTimer -= dt; 
				if(this.rollCooldownTimer < 0)
				{
					this.rollCooldownTimer = this.rollTime/2; 
					this.canRoll = true; 
				}
			},
			//timer for attack animations
			cooldownAttack : function(){
				if(!input.isDown('x'))
				{
					this.canAttack = true; 
					this.attackLeftSprite._index = 0; 
					this.attackRightSprite._index = 0; 
				}
			},
			//switches player behavior animations
			updateAnim : function(dt){
				switch(this.animState)
				{
				case "IDLE_STATE": 
					if(this.facingRight)
					{
						this.sprite = this.idleRightSprite; 
					}
					else{
						this.sprite = this.idleLeftSprite; 
					}
					break; 
				case "RUN_STATE": 
					if(this.facingRight)
					{
						this.sprite = this.runRightSprite; 
					}
					else{
						this.sprite = this.runLeftSprite; 
					}
					break; 
				case "BLOCK_STATE": 
					if(this.facingRight)
					{
						this.sprite = this.blockRightSprite; 
					}
					else{
						this.sprite = this.blockLeftSprite; 
					}
					break; 
				case "ROLL_STATE": 
					var rollDir; 
					if(this.facingRight)
					{ 
						rollDir = 'right'; 
						this.sprite = this.rollRightSprite; 
					} 
					else{ 
						rollDir = 'left'; 
						this.sprite = this.rollLeftSprite; 
					}
					this.roll(dt,rollDir); 
					break; 
				case "ATTACK_STATE":
					if(this.facingRight)
					{
						this.sprite = this.attackRightSprite; 
						this.attack(dt); 
					}
					else
					{
						this.sprite = this.attackLeftSprite; 
						this.attack(dt); 
					}
					//attack 
					
					break; 
				}
				//console.log(this.animState); 
				
				//roll cooldown
				if(!this.canRoll) 
				{ 
					this.cooldownRoll(dt); 
				}
				//attack cooldown
				if(!this.canAttack)
				{ 
					this.cooldownAttack(); 
				}
				
				if(this.invulnerable)
				{
					this.invulnerableTimer -= dt; 
					this.blinkCount ++; 
					
					if(this.blinkCount % 10 == 0)
					{
						//console.log('blink'); 
						this.blink = true; 
					}
					else{ this.blink = false; } 
					
					if(this.invulnerableTimer <= 0)
					{
						this.invulnerableTimer = 3; 
						this.invulnerable = false; 
						this.blink = false; 
					}
				}
			},
			//puts collision rectangles where they should be in relation to the player's sprite
			updateCollRects : function(){
				//facing left
				if(!this.facingRight)
				{ 
					this.collRectOffset[0] = 60; 
					this.attackRectOffset[0] = 0; 
				} 
				else //facing Right
				{ 
					this.collRectOffset[0] = 50; 
					this.attackRectOffset[0] = 110;
				}
				if(this.animState == "ROLL_STATE")
				{
					this.coll_Rect[3] = 50; 
					this.coll_Rect[1] = 50; 
					this.coll_Rect[1] = this.pos[1] + this.collRectOffset[1] + 50; 
				}
				else{ this.coll_Rect[3] = 100; this.coll_Rect[1] = this.pos[1] + this.collRectOffset[1];  }
				//collision rectangle
				this.coll_Rect[0] = this.pos[0] + this.collRectOffset[0]; 
				
				//attack rectangle
				this.attack_Rect[0] = this.pos[0] + this.attackRectOffset[0]; 
				this.attack_Rect[1] = this.pos[1] + this.attackRectOffset[1]; 
			}, 
			
		};

		return Player; 
		
}();