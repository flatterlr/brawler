"use strict"; 

var app = app || {}; 

app.Enemy = function(){

		function Enemy(xPos,startHealth) {
			this.size = [126,101]; 
			this.coll_Rect = [0,0,86,101]; 
			this.collRectOffset = [20,0]; 
			this.speed = 50; 
			this.pos = [xPos, app.brawler.canvas.height- this.coll_Rect[3] -73]; 
			this.startHealth = startHealth; 
			this.health = startHealth; 
			
			var baseXSpeed = 150; 
			var speedMod = Math.floor(Math.random()* 300 );
			this.xSpeed = baseXSpeed + speedMod; 
			
			this.active = true; 
			
			this.facingRight = true; 
			
			this.Behaviors = {
				spawn : "SPAWN",
				idle : "IDLE",
				move : "MOVE",
				attack : "ATTACK",
				hit : "HIT",
				dying: "DYING",
			}; 
			this.behavior = this.Behaviors.spawn; 
			
			this.debugStroke = 'green'; 
			
			this.load(); 
			this.sprite = this.idleRightSprite; 
			
			this.spawnWait = 0.3; 
			this.canAttack = false; 
			this.attackTime = .3; 
			this.attackTimer = this.attackTime; 
			this.attackCoolDownTimer = this.attackTime * 3; 
			this.offsetLeftAttack = true; 
			
			this.attack_Rect = [0,50,50,100]; 
			this.attackRectOffset = [0,0]; 
			this.attacking = false; 
			
			this.knockBack = 0; 
		};

		Enemy.prototype = {
			//creates animation sprites
			load: function() {
				var enemyNumber = 0; 
				var enemyNumber = Math.floor(Math.random()* 7 );
				var enemySheetWidth = 484; 
				
				//function Sprite(url, sPos,parentPos, size, speed, frames, once)
				this.idleRightSprite = new app.Sprite('img/enemySheet.png',[enemySheetWidth * enemyNumber ,0],this.pos,[this.size[0],this.size[1]],3,[0,1]);
				this.idleLeftSprite = new app.Sprite('img/enemySheet.png',[enemySheetWidth * enemyNumber ,this.size[1]],this.pos,[this.size[0],this.size[1]],3,[1,0]);
				
				this.runRightSprite = new app.Sprite('img/enemySheet.png',[enemySheetWidth * enemyNumber ,this.size[1]*2],this.pos,[this.size[0],this.size[1]],6,[0,1]);
				this.runLeftSprite = new app.Sprite('img/enemySheet.png',[enemySheetWidth * enemyNumber ,this.size[1]*3],this.pos,[this.size[0],this.size[1]],6,[1,0]);
				
				this.attackRightSprite = new app.Sprite('img/enemySheet.png',[enemySheetWidth * enemyNumber,this.size[1]*4],this.pos,[161,this.size[1]],10,[0,1,2]);
				this.attackLeftSprite = new app.Sprite('img/enemySheet.png',[enemySheetWidth * enemyNumber  ,this.size[1]*5],this.pos,[161,this.size[1]],10,[2,1,0]);
				
				this.poofDeathSprite = new app.Sprite('img/poofDeath.png',[0,0],this.pos,[128,125],10,[0,1,2,3,4],true);
			},
			//updates enemy
			update: function(dt) { 
				this.updateBehavior(dt); 
				this.updateCollRects();
				this.sprite.update(dt); 
			},
			//draws enemy
			draw: function(ctx) {
				this.sprite.draw(ctx); 
				
				if(app.brawler.debugging)
				{
					ctx.beginPath();
					ctx.rect(this.coll_Rect[0], this.coll_Rect[1], this.coll_Rect[2], this.coll_Rect[3]);
					ctx.lineWidth = 2;
					ctx.strokeStyle = this.debugStroke;
					ctx.stroke();
					
					if(this.attacking)
					{
						ctx.beginPath();
						ctx.rect(this.attack_Rect[0], this.attack_Rect[1], this.attack_Rect[2], this.attack_Rect[3]);
						ctx.lineWidth = 2;
						ctx.strokeStyle = this.debugStroke;
						ctx.stroke();
					}
				}
			},
			//updates the behavior enum for enemy behavior
			updateBehavior: function(dt){
				var distToPlayer = Math.abs(app.brawler.player.pos[0] - this.pos[0]); 
				switch(this.behavior)
				{
					case "SPAWN": 
						this.sprite = this.idleRightSprite; 
						
						this.spawnWait -= dt; 
						if(this.spawnWait < 0)
						{
							this.behavior = this.Behaviors.idle; 
						}
						break; 
						
					case "IDLE": 
					
						if(this.facingRight)
						{
							this.sprite = this.idleRightSprite; 
							if(distToPlayer < 100)
							{
								this.behavior = this.Behaviors.attack; 
							}
						}
						else
						{
							this.sprite = this.idleLeftSprite; 
							if( !this.offsetLeftAttack)
							{
								this.offsetLeftAttack = true;
								this.collRectOffset[0] -= 34; 
								this.pos[0] += 34; 
							}
							
							if(distToPlayer < 150)
							{
								this.behavior = this.Behaviors.attack; 
							}
						}
						
						if(distToPlayer > 130)
						{
							this.behavior = this.Behaviors.move; 
						}
						break; 
						
					case "MOVE": 
						this.canAttack = false; 
						if(this.facingRight)
						{
							this.sprite = this.runRightSprite; 
						}
						else{
							this.sprite = this.runLeftSprite; 
						}
						if(this.moveTo([app.brawler.player.pos[0],this.pos[1]],this.xSpeed,dt))
						{
							this.behavior = this.Behaviors.idle; 
						}
						break; 
						
					case "ATTACK": 
						if(this.canAttack)
						{
							this.attackTimer -= dt;  
							
							createjs.Sound.play('enemyAttack',{volume: app.brawler.soundEffectVolume}); 
							
							if(!this.facingRight)//facing left
							{
								this.facingRight = false; 
								this.sprite = this.attackLeftSprite; 
								if(this.offsetLeftAttack) 
								{ 
									this.pos[0] -= 34; 
									this.coll_Rect[0] += 304; 
									this.offsetLeftAttack = false; 
									this.collRectOffset[0] += 34; 
								}
							} 
							else //facing right
							{ 
								this.facingRight = true; 
								this.sprite = this.attackRightSprite; 
							}
						
							if(this.attackTimer <= 0)
							{ 
								this.attackTimer = this.attackTime; 
								
								this.behavior = this.Behaviors.idle; 
								this.canAttack = false; 
							}
						}
						break; 
						
						case "HIT": 
							if(this.moveTo([this.knockBack,this.pos[1]],800,dt))
							{
								this.behavior = this.Behaviors.idle; 
							}
						break; 
						
						case "DYING": 
							this.sprite = this.poofDeathSprite; 
							this.pos[1] -=2; 
							if(this.sprite.done){ 
								this.active = false; 
								app.brawler.appsDefeated ++; 
								app.brawler.score += 10 * this.startHealth; 
								if(app.brawler.appsDefeated % 3 == 0) { app.brawler.enhanceDifficulty(); }
							}
						break; 
				}
				
				if(!this.canAttack) 
				{ 
					this.attackCoolDownTimer -= dt; 
					if(this.attackCoolDownTimer < 0)
					{
						this.attackCoolDownTimer = this.attackTime * 3; 
						this.canAttack = true; 
						this.attackLeftSprite._index = 0; 
						this.attackRightSprite._index = 0; 
					}
				}
				
				if(this.behavior == 'ATTACK' && this.canAttack) { this.attacking = true; }
				else { this.attacking = false; }
				
			},
			//changes the position of the collision rectangles to match the enemy sprite position
			updateCollRects : function(){
				if(this.facingRight)
				{
					this.attackRectOffset = [108,0]; 
				}
				else
				{
					this.attackRectOffset = [0,0]; 
				}
				//collision rectangle
				this.coll_Rect[0] = this.pos[0] + this.collRectOffset[0]; 
				this.coll_Rect[1] = this.pos[1] + this.collRectOffset[1]; 
				//attack rectangle
				this.attack_Rect[0] = this.pos[0] + this.attackRectOffset[0]; 
				this.attack_Rect[1] = this.pos[1] + this.attackRectOffset[1]; 
			}, 
			//moves to a position over time
			moveTo: function(destination,speed,dt){
				var xReached = false; 
				var yReached = false; 
				var xDir = 1; 
				var yDir = 1; 
				var buffer = 100; 
				this.facingRight = true; 
				
				//if the destination is to the left
				if(destination[0] < this.pos[0]) 
				{ 
					xDir = -1; 
					buffer = 120;
					this.facingRight = false; 
				}
				
				if(Math.abs(destination[0] - this.pos[0]) < buffer)
				{ 
					xReached = true; 
				}
				else
				{
					this.pos[0] += speed * dt * xDir;
				}
				
				if(Math.abs(destination[1] - this.pos[1]) < buffer)
				{
					this.pos[1] = destination[1]; 
					yReached = true; 
				}
				else
				{
					this.pos[1] += this.ySpeed * dt * yDir;
				}
				
				if(xReached && yReached)
				{
					return true; 
				}
				
				return false; 
			}, 
			//called when an enemy takes damage
			hit: function(dir, force)
			{
				this.knockBack = force * dir + this.pos[0]; 
				this.behavior = this.Behaviors.hit; 
				this.health --; 
				if(this.health <= 0)
				{
					this.behavior = 'DYING'; 
				}
			},
			
		};

		return Enemy; 
		
}();