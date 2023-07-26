class Repeater {
  fpsThrottle = 16;
  lastDraw = performance.now();

  frame = {
    interval: 16,
    count: 0,
    start: performance.now(),
    end: 0,
    fps: 0,
    delta: 0,
  };

  stats = {
    lastRun: -1
  }

  paused = false;

  update () {}

  start () {
    delete this.start;
    this.stats.lastRun = performance.now();
    // fps.sampleSize = 120;

    this.run();
  }

  run () {
    const stats = this.stats;
    const f = this.frame;

    if (this.paused == true) return;

    requestAnimationFrame(this.run.bind(this));

    const now = performance.now()
    let elapsed = now - stats.lastRun;

    if (elapsed > this.fpsThrottle){
      stats.lastRun = now - (elapsed % this.fpsThrottle);

      typeof this.update == 'function' && this.update(this);
      
      f.fps = 1;
    }
  }



  pause(paused = !this.paused == true) {
    this.paused = paused;

    if (!paused) this.run(this.update);
  }
}

class FPS {
  constructor(sampleSize) {
    this.sampleSize = sampleSize ?? 60;
    this.value = 0;
    this.samples = [];
    this.currentIndex = 0;
    this.lastTick = null;
  }

  tick() {
    if (!this.lastTick) {
      this.lastTick = performance.now();
      return 0;
    }

    const now = performance.now();
    const delta = (now - this.lastTick) / 1000;
    const currentFPS = 1 / delta;

    this.samples[this.currentIndex] = Math.round(currentFPS);

    let total = 0;
    for (let i = 0; i < this.samples.length; i++) {
      total += this.samples[i];
    }

    const average = Math.round(total / this.samples.length);

    this.value = average;
    this.lastTick = now;
    this.currentIndex++;
    if (this.currentIndex === this.sampleSize) {
      this.currentIndex = 0;
    }

    return this.value;
  }
}

class newRepeater {
  time;
  frame = -1;
  paused = false;

  #RafRef;
  #setFps = -1;
  #actualFps = -1;

  constructor (fps, callback){
    this.#setFps = fps;
    this.delay = 1000 / fps;
    this.callback = callback;
    this._fpsHandler = new FPS();
  }

  loop (timestamp){
    if (this.time == null) this.time = timestamp;

    let seg = Math.floor((timestamp - this.time) / this.delay);

    if (seg > this.frame){
      this.frame = seg;
      this.#actualFps = this._fpsHandler.tick();
      this.callback(this);
    }

    this.#RafRef = requestAnimationFrame(this.loop.bind(this));
  }

  get setFps (){
    return this.#setFps;
  }

  get fps (){
    return this.#actualFps;
  }

  set fps (newFps){
    if (!arguments.length) return;

    this.#setFps = newFps;
    this.delay = 1000;
    this.frame = -1;
    this.time = null;
  }

  start (){
    if (this.paused == false)
      this.#RafRef = requestAnimationFrame(this.loop.bind(this));
  }

  pause (paused = !this.paused == true){
		this.paused = paused;

    if (this.paused){
			this.start();
		}
		else {
      cancelAnimationFrame(this.#RafRef);

      this.paused = false;
      this.time = null;
      this.frame = -1;
    }
  }
}


window.newRepeater = newRepeater;
export default Repeater;

export {
  newRepeater as Repeater,
	FPS
}