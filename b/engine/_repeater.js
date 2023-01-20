import bind from './_bind.js';

let prevFrameTime, frameTime = 1, curLoop, prevLoop;
let filterStrength = 20;

export default class repeater {
  constructor () {
    bind(this, {
      paused: false,
      queue: [],
      frame: {
        interval: 16,
        count: 0,
        start: performance.now(),
        end: 0,
        fps: 0
      },
      update: () => {}
    });

    let { frame: f } = this;

    setInterval(function (){
      f.fps = 1000 / f.frameTicks;
      f.frameTicks = 1;
    }, 1000);
  }
  
  run (){
    let { update, run, paused, queue: q, frame: f } = this;
    let { end } = f;
    f.delta = performance.now() - f.start;

    if (q.length > 0){
      q[0]();
      q.shift();

      return requestAnimationFrame(run.bind(this, update));
    }

    prevFrameTime = (curLoop = Date.now()) - prevLoop;
    frameTime += ((prevFrameTime || 0) - frameTime) / filterStrength;
    prevLoop = curLoop;

    f.fps = Math.floor(1000 / frameTime);

    if (paused == true
      ||
      (end < f.count && end > 0)
    ) return false;

    if (f.delta >= f.interval) {
      update(this);

      f.start = null;
      f.count++;
    };
    
    requestAnimationFrame(run.bind(this, update));
  };

  start (){
    this.start = undefined;
    this.run(this.update);
  }

  pause (paused = !this.paused == true){
    if ((this.paused = paused) == false) this.run(this.update);
  }
}