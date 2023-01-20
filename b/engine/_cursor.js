import bind from './_bind.js';

export default class cursor {
  constructor (object = document.body){
    bind(this, {
      object,
      pos: {
        x: 0, y: 0, down: false
      },
      click: {},
      release: {},
      context: {},
      start: {},
      end: {},
      button: -1
    });


    for (let on of Object.values(this.on)){
      object.addEventListener(on[0], on[1].bind(this));
    }
  }

  on = {
    move: [
      'mousemove',
      function (e){
        const { object } = this;
        const rect = object.getBoundingClientRect();

        this.pos.x = ((e.clientX - rect.left) / (rect.right - rect.left)) * object.width;
        this.pos.y = ((e.clientY - rect.top) / (rect.bottom - rect.top)) * object.height;
      }
    ],
    click: [
      'click',
      e => e.preventDefault()
    ],
    context: [
      'contextmenu',
      e => e.preventDefault()
    ],
    up: [
      'mouseup',
      e => {
        let r = this.release;
        
        for (let f of Object.keys(r)) r[f](this);

        this.button = e.button;
        this.end = { x: this.pos.x, y: this.pos.y };
        this.down = false;
      }
    ],
    down: [
      'mousedown',
      e => {
        let c = this.click;
        let c2 = this.context;

        switch (e.which){
          case 1: for (let f of Object.keys(c)) c[f](this); break;
          case 3: for (let f of Object.keys(c2)) c2[f](this); break;
        }

        this.button = e.button;
        this.start = { x: this.pos.x, y: this.pos.y };
        this.down = true;
      }
    ]
  }
}