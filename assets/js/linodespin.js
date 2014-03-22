var ALPHA, AudioAnalyser, COLORS, MP3_PATH, NUM_BANDS, MAX_PARTICLES, Particle, SCALE, SIZE, SMOOTHING, SPEED, SPIN;
MAX_PARTICLES = 100;
NUM_BANDS = 128;
SMOOTHING = 0.5;
MP3_PATH = 'assets/RATM.mp3';
SCALE = {
	MIN: 5.0,
	MAX: 80.0
};
SPEED = {
	MIN: 0.2,
	MAX: 1.0
};
ALPHA = {
	MIN: 0.8,
	MAX: 0.9
};
SPIN = {
	MIN: 0.001,
	MAX: 0.005
};
SIZE = {
	MIN: 0.5,
	MAX: 1.25
};
COLORS = ['#00b259', '#004812', '#4ea1dc', '#d5d5d5'];
AudioAnalyser = (function() {
	AudioAnalyser.AudioContext = self.AudioContext || self.webkitAudioContext;
	AudioAnalyser.enabled = AudioAnalyser.AudioContext != null;
	function AudioAnalyser(audio, numBands, smoothing) {
		var src,
		_this = this;
		this.audio = audio != null ? audio : new Audio();
		this.numBands = numBands != null ? numBands : 256;
		this.smoothing = smoothing != null ? smoothing : 0.3;
		if (typeof this.audio === 'string') {
			src = this.audio;
			this.audio = new Audio();
			this.audio.controls = true;
			this.audio.src = src;
		}
		this.context = new AudioAnalyser.AudioContext();
		this.jsNode = this.context.createJavaScriptNode(2048, 1, 1);
		this.analyser = this.context.createAnalyser();
		this.analyser.smoothingTimeConstant = this.smoothing;
		this.analyser.fftSize = this.numBands * 2;
		this.bands = new Uint8Array(this.analyser.frequencyBinCount);
		this.audio.addEventListener('canplay', function() {
			_this.source = _this.context.createMediaElementSource(_this.audio);
			_this.source.connect(_this.analyser);
			_this.analyser.connect(_this.jsNode);
			_this.jsNode.connect(_this.context.destination);
			_this.source.connect(_this.context.destination);
			return _this.jsNode.onaudioprocess = function() {
				_this.analyser.getByteFrequencyData(_this.bands);
				if (!_this.audio.paused) {
					return typeof _this.onUpdate === "function" ? _this.onUpdate(_this.bands) : void 0;
				}
			};
		});
	}
	AudioAnalyser.prototype.start = function() {
		return this.audio.play();
	};
	AudioAnalyser.prototype.stop = function() {
		return this.audio.pause();
	};
	return AudioAnalyser;
})();

function Particle( x, y, radius ) {
	this.x = x != null ? x : 0;
	this.y = y != null ? y : 0;
	this.reset();
}

Particle.prototype = {
	reset: function( x, y, radius ) {
		this.level = 1 + floor(random(4));
		this.scale = random(SCALE.MIN, SCALE.MAX);
		this.alpha = random(ALPHA.MIN, ALPHA.MAX);
		this.speed = random(SPEED.MIN, SPEED.MAX);
		this.color = random(COLORS);
		this.size = random(SIZE.MIN, SIZE.MAX);
		this.spin = random(SPIN.MAX, SPIN.MAX);
		this.band = floor(random(NUM_BANDS));
		if (random() < 0.5) {
			this.spin = -this.spin;
		}
		this.smoothedScale = 0.0;
		this.smoothedAlpha = 0.0;
		this.decayScale = 0.0;
		this.decayAlpha = 0.0;
		this.rotation = random(TWO_PI);
		return this.energy = 0.0;
	},
	move: function() {
		this.rotation += this.spin;
		return this.y -= this.speed * this.level;
	},
	draw: function( ctx ) {
		var alpha, power, scale;
		power = exp(this.energy);
		scale = this.scale * power;
		alpha = this.alpha * this.energy * 1.5;
		this.decayScale = max(this.decayScale, scale);
		this.decayAlpha = max(this.decayAlpha, alpha);
		this.smoothedScale += (this.decayScale - this.smoothedScale) * 0.3;
		this.smoothedAlpha += (this.decayAlpha - this.smoothedAlpha) * 0.3;
		this.decayScale *= 0.985;
		this.decayAlpha *= 0.975;
		ctx.save();
		ctx.beginPath();
		ctx.translate(this.x + cos(this.rotation * this.speed) * 250, this.y);
		ctx.rotate(this.rotation);
		ctx.scale(this.smoothedScale * this.level, this.smoothedScale * this.level);
		ctx.moveTo(this.size * 0.5, 0);
		ctx.lineTo(this.size * -0.5, 0);
		ctx.lineWidth = 1;
		ctx.lineCap = 'square';
		ctx.globalAlpha = this.smoothedAlpha / this.level;
		ctx.strokeStyle = this.color;
		ctx.stroke();
		return ctx.restore();
	}
};

Sketch.create({
	particles: [],
	setup: function() {
		var analyser, error, i, intro, particle, warning, x, y, _i, _ref, _this = this;
		for (i = _i = 0, _ref = MAX_PARTICLES - 1; _i <= _ref; i = _i += 1) {
			x = random(this.width);
			y = random(this.height * 2);
			particle = new Particle(x, y);
			particle.energy = random(particle.band / 256);
			this.particles.push(particle);
		}
		try {
			analyser = new AudioAnalyser(MP3_PATH, NUM_BANDS, SMOOTHING);
			analyser.onUpdate = function(bands) {
				var _j, _len, _ref1, _results;
				_ref1 = _this.particles;
				_results = [];
				for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
					particle = _ref1[_j];
					_results.push(particle.energy = bands[particle.band] / 256);
				}
				return _results;
			};
			analyser.start();
			document.body.appendChild(analyser.audio);
		}
		catch (_error) {
			error = _error;
		}
	},
	draw: function() {
		var particle, _i, _len, _ref, _results;
		this.globalCompositeOperation = 'lighter';
		_ref = this.particles;
		_results = [];
		for (_i = 0, _len = _ref.length; _i < _len; _i++) {
			particle = _ref[_i];
			if (particle.y < -particle.size * particle.level * particle.scale * 2) {
				particle.reset();
				particle.x = random(this.width);
				particle.y = this.height + particle.size * particle.scale * particle.level;
			}
			particle.move();
			_results.push(particle.draw(this));
		}
		return _results;
	}
});
