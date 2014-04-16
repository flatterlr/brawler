"use strict"; 

var app = app || {}; 

app.Finger = function(){

		function Finger(xPos) {
			this.size = [190,584]; 
			this.coll_Rect = [0,0,160,584]; 
			this.hoverHeight = app.brawler.canvas.height - this.size[1] - 500; 
			this.tapHeight = app.brawler.canvas.height - this.size[1] - 72; 
			this.downPosition = false; 
			this.xSpeed = 300; 
			this.ySpeed = 600; 
			//this.pos = [50, app.brawler.canvas.height - this.size[1] - this.hoverHeight]; 
			this.pos = [xPos, this.hoverHeight]; 
			this.img = resources.get("img/finger.png");
			this.defaultDownTime = .25; 
			this.downTime = this.defaultDownTime; 
			this.canTap = false; 
			this.tapCooldown = 0; 
			this.tapCooldownTimer = this.tapCooldown; 
			
			this.spawnOnce = false,
			
			this.Behaviors = {
				move : "MOVE",
				aim : "AIM",
				tap : "TAP",
			}; 
			
			this.behavior = this.Behaviors.aim; 
			this.destination = [,]; 
		};

		Finger.prototype = {
			//updates the finger enemy
			update: function(dt) { 
				this.updateBehavior(dt); 
				this.updateCollRect(); 
			},
			//draws the finger enemy
			draw: function(ctx) {
			
				ctx.drawImage(this.img, this.pos[0], this.pos[1], this.size[0], this.size[1]); 
				
				if(app.brawler.debugging)
				{
					ctx.beginPath();
					ctx.rect(this.coll_Rect[0], this.coll_Rect[1], this.coll_Rect[2], this.coll_Rect[3]);
					ctx.lineWidth = 2;
					ctx.strokeStyle = 'red';
					ctx.stroke();
				}
			},
			//updates finger behavior
			updateBehavior: function(dt){
				
				switch(this.behavior)
				{
					case "AIM": 
						this.destination[0] = Math.floor((Math.random()* (app.brawler.canvas.width -this.size[0]) ) );
						this.destination[1] = this.pos[1]; 
						this.behavior = this.Behaviors.move; 
						break;
						
					case "MOVE": 
						if(this.moveTo(this.destination,dt))
						{
							if(this.canTap)
							{
								if(this.downTimer(dt))
								{
								this.behavior = this.Behaviors.tap; 
								this.destination[1] = this.tapHeight; 
								this.canTap = false; 
								this.downTime = this.defaultDownTime; 
								}
							}
							else { this.behavior = this.Behaviors.aim; }
						}
						break; 
						
					case "TAP": 
						//move down until you reach bottom
						if(this.moveTo(this.destination,dt))
						{
							app.brawler.glowSize = 120; 
							this.downPosition = true; 
							if(this.downTimer(dt))
							{
								app.brawler.glowSize = 50; 
								if(!this.spawnOnce)
								{
									//console.log("Tapped at X of " + this.destination[0] ); 
									createjs.Sound.play("enemySpawn",{volume: app.brawler.soundEffectVolume});
									this.spawnOnce = true; 
									var enemy = new app.Enemy(this.pos[0] + 65,app.brawler.enemyHealth); 
									app.brawler.enemies.push(enemy); 
								}
								
								//set destination back to hover
								this.destination[1] = this.hoverHeight; 
								if(this.moveTo(this.destination,dt))
								{
									this.downTime = this.defaultDownTime; 
									this.behavior = this.Behaviors.aim; 
									this.spawnOnce = false; 
									this.downPosition = false; 
								}
							}
						}
						break; 
				}
				
				if(!this.canTap) { this.cooldownTap(dt); }
			},
			//updates collision rectangle for finger
			updateCollRect : function(){
				this.coll_Rect[0] = this.pos[0] + 15; 
				this.coll_Rect[1] = this.pos[1] ; 
			}, 
			//moves to a specific position overTime
			moveTo: function(destination,dt){
				var xReached = false; 
				var yReached = false; 
				var xDir = 1; 
				var yDir = 1; 
				
				if(destination[0] < this.pos[0]) { xDir = -1; }
				if(destination[1] < this.pos[1]) { yDir = -1; }
				
				if(Math.abs(destination[0] - this.pos[0]) < 15)
				{  
					xReached = true; 
				}
				else
				{
					this.pos[0] += this.xSpeed * dt * xDir;
				}
				
				if(Math.abs(destination[1] - this.pos[1]) < 15)
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
			//used as a timer to measure how long the finger stays down before rising 
			downTimer: function(dt){
				this.downTime -= dt; 
				if(this.downTime <= 0)
				{ 
					return true; 
				}
				return false; 
			},
			//times how long the finger waits before tapping again
			cooldownTap : function(dt){
				this.tapCooldownTimer -= dt; 
				if(this.tapCooldownTimer < 0)
				{
					this.tapCooldownTimer = app.brawler.fingerCooldown; 
					this.canTap = true; 
				}
			},
			
		};

		return Finger; 
		
}();