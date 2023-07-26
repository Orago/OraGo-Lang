const holdTime = 500;

export default class cursor {
  constructor (object = document.body){
    this.object = object;

    for (const [method, func] of Object.entries(this.on))
      object.addEventListener(method, func.bind(this));
  }

  pos = {
    x: 0,
    y: 0,
    down: false
  }

  button = -1;
  context = {};
  release = {};
  click = {};
  start = { x: 0, y: 0 };
  end = { x: 0, y: 0 };
  #startTime;

  getPos (x, y){
    const { object } = this;
    const { top, bottom, left, right, width, height } = object.getBoundingClientRect();

    return {
      x: ((x - left) / (right - left)) * width,
      y: ((y - top) / (bottom - top)) * height
    }
  }

  onMove (x, y){
    this.pos = this.getPos(x, y);
  }

  onStart (e){
    let shouldBreak = false;
    this.startTime = performance.now();

    setTimeout(() => {
      if (this.down == true && window.TouchEvent && e instanceof Touch){
        Object.values(this.context).forEach($ => $(this));
        shouldBreak = true;
      }
    }, holdTime);


    if (!(window.TouchEvent && e instanceof Touch) && !shouldBreak)
      switch (e?.which){
        case 1: Object.values(this.click).forEach($ => $(this)); break;
        case 3: Object.values(this.context).forEach($ => $(this)); break;
      }

    this.pos = this.getPos(e.clientX, e.clientY);
    this.start = this.getPos(e.clientX, e.clientY);
    this.button = e.button;
    this.down = true;
  }

  onEnd (e){
    if (window.TouchEvent && e instanceof Touch)
      Object.values(this.click).forEach($ => $(this));

    const { release } = this;

    Object.values(release).forEach($ => $(this));

    this.end = this.getPos(e.clientX, e.clientY);
    this.down = false;
  }

  on = {
    mousemove:   e => this.onMove(e.clientX, e.clientY),
    touchmove:   e => this.onMove(e.touches[0].clientX, e.touches[0].clientY),
    click:       e => e.preventDefault(),
    contextmenu: e => e.preventDefault(),
    mouseup:     e => this.onEnd(e),
    mousedown:   e => this.onStart(e),
    touchstart:  e => this.onStart(e.touches[0]),
    touchend:    e => this.onEnd(e.changedTouches[0])
  }
}