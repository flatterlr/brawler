"use strict"; 

var app = app || {}; 

app.Sprite = function(){

    function Sprite(url, sPos,parentPos, size, speed, frames, once) {
        this.sPos = sPos;
		this.parentPos = parentPos; 
        this.size = size;
        this.speed = typeof speed === 'number' ? speed : 0;
		this.speed = speed;
        this.frames = frames;
        this._index = 0;
        this.once = once;
		this.url = url; 
		
		this.currentFrame; 
    };
	
    Sprite.prototype = {
        update: function(dt) {
            this._index += this.speed*dt;
        },

        draw: function(ctx) {
            var frame;

            if(this.speed > 0) {
                var max = this.frames.length;
                var idx = Math.floor(this._index);
                frame = this.frames[idx % max];
				this.currentFrame = frame; 

                if(this.once && idx >= max) {
                    this.done = true;
                    return;
                }
            }
            else {
                frame = 0;
            }


            var sX = this.sPos[0];
            var sY = this.sPos[1];
			
			var x = this.parentPos[0]; 
			var y = this.parentPos[1]; 

            sX += frame * this.size[0];
			
			var img = resources.get(this.url);
			
			ctx.drawImage(img, sX, sY, this.size[0], this.size[1], x, y,this.size[0], this.size[1]); 
        },
    };

    return Sprite; 
}();