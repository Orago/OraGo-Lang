import { Repeater } from './_repeater.js';
import keyboard from './_keyboard.js';
import cursor from './_cursor.js';

const zoomIncrement = .2;

const engineObject = function (data = {}){
	const obj = {
    id: (rsl > 0 ? rsl : 1) * Date.now(),
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    layer: 1,

    enabled: true,
    visible: true,

    update  (){},
    onClick (){},
    ...data,
  }
	let rsl = this.renderListSize();

	obj.pop = () => this.renderList.delete(obj);

	obj.push = (...tags) => {
		this.renderList.add(obj);

    tags.forEach(tag => tag?.isObjGroup == true && tag.add(obj));

		return obj;
	}
	
	obj.canvas = this.canvas;

	obj.collides = (restriction = () => false) => {
		for (let otherObj of this.renderList.values())
			if (
        obj != otherObj &&
        restriction(obj, otherObj)
			) return true;

		return false;
	}

	obj.scaled = () => {
		const s = this.zoom;
		let { x, y, w ,h } = obj;

		x *= s; y *= s;
		w *= s; h *= s;

		return { x, y, w, h };
	};

	obj.rendered = () => {
		const { offset: o } = this;
		let { x, y, w, h } = obj.scaled();

		x += o.x;
		y += o.y;

		return { x, y, w, h };
	}

  obj.enable = () => {
    obj.visible = true;
    obj.enabled = true;
  }

  obj.disable = () => {
    obj.visible = false;
    obj.enabled = false;
  }

	if (data.init) data.init(obj); 

	return obj;
}

class createObjectGroup {
  isObjGroup = true;

  #items = new Set();
  
  constructor (engine){
    if (engine?._pc_by_orago != 'orago is the coolest lol') throw 'Cannot Create Tag Set';
    
    this.engine = engine;
  }

  add = (...items) => items.forEach(item => this.#items.add(item));

  kill = () => this.#items.forEach(item => {
    this.engine.renderList.delete(item);
    this.#items.delete(item);
  });

  get items (){
    return [...this.#items];
  }
}

class engine {
  _pc_by_orago = 'orago is the coolest lol';

  renderList = new Set();

  zoom = 3;

  offset = {
    x: 0, y: 0,
    cache: { x: 0, y: 0 }
  };

  panEnabled = false;

  enabled = [];

	constructor (canvas){
    this.swapCanvas(canvas);

		this.renderRepeater = new Repeater(64, () => {
			const { renderList } = this;
      const items = [...renderList];

      this.frame = this?.renderRepeater?.frame;

			this.canvas.clear();

			items.sort((a, b) => a.layer - b.layer);

			for (const item of items){
				let { x, y, w, h, visible } = item;
				
				if (typeof item.update == 'function') item.update();

				x += item.offsetx;
				y += item.offsety;

				if (typeof item.render == 'function' && visible == true)
					item.render(x, y, w, h);
			}
		});

		
		this.renderRepeater.start();

		this.cursor.click.objClicked = async cursor => {
      const { renderList } = this;
      const items = [...renderList];

			items.sort((a, b) => b.layer - a.layer)

			for (const obj of items){
				const clicked = this.collision.rect(obj, cursor.pos);

				if (clicked == true && obj.enabled){
          obj.onClick(cursor.pos);

          if (typeof obj.whileClick == 'function')
            while (cursor.down == true)
              obj.whileClick(cursor.pos);
          
          if (obj.button == true) break;
        }
			}
		}

	}

  swapCanvas (canvas){
    this.canvas = canvas;
    canvas.canvas.setAttribute('tabindex', '1');
		
		this.cursor   = new cursor(canvas.canvas);
		this.keyboard = new keyboard(canvas.canvas);
  }

  loadFont (name, url){
    // const font = new FontFace(id, `url(${url}) format("woff2")`);
    // font.load().then(function(loadedFont) {
    //   document.fonts.add(loadedFont);
    // })
    // .catch(function(error) {});
  }

	renderListSize = () => this.renderList.size;

	collision = {
		rect: (rect1, rect2) => {
      if (
        rect1.x + rect1.w > rect2.x &&
        rect1.x < rect2.x + rect2.w &&
        rect1.y + rect1.h > rect2.y &&
        rect1.y < rect2.y + rect2.h
      ) return true; // Collision detected

      return false; // No collision
		},

    rectContains: (a, b) => {
      a.w = a.w || 0;            /* | */ a.h = a.h || 0;
      a.x2 = (a.x + a.w) || a.x; /* | */ a.y2 = (a.y + a.h) || a.y;
      
      b.w = b.w || 0;            /* | */ b.h = b.h || 0;
      b.x2 = (b.x + b.w) || b.x;
      b.y2 = (b.y + b.h) || b.y;

      return a.x <= b.x && a.x2 >= b.x2 && a.y <= b.y && a.y2 >= b.y2;
    },

    circle: (a, b) => {
      const distX = Math.abs(b.x - a.x);
      const distY = Math.abs(b.y - a.y);

      const distance = Math.sqrt((distX * distX) + (distY * distY));

      return distance < a.r + b.r;
    }
	};

	object = engineObject;

	scaled (){
		const s = this.zoom;
		let { x, y, w, h } = obj;

		x *= s; y *= s;
		w *= s; h *= s;

		return { x, y, w, h };
	};
  
  get objectGroup (){
    return new createObjectGroup(this);
  }

	rendered (){
		const { x, y, w, h } = this.scaled();

		return {
			x: x + this.offset.x,
			y: y + this.offset.y,
			w: w,
			h: h
		}
	}

	showEnabled = key => this.enabled.push(key);

	hideEnabled = key => this.enabled = this.enabled.filter(e => e != key);

	allowZoom () {
		const eng = this;

		this.onZoom = function(e){
			if(e.deltaY > 0 && eng.zoom > zoomIncrement) eng.zoom -= zoomIncrement;
			if(e.deltaY < 0 && eng.zoom < 20) eng.zoom += zoomIncrement;
		};

		this.canvas.canvas.addEventListener('wheel', eng.onZoom, false);

    let initialDistance = null;

    function parsePinchScale (event){
      if (event.touches.length !== 2) return;

      const [touch1, touch2] = event.touches;
      const distance = Math.sqrt(
        (touch2.pageX - touch1.pageX) ** 2 + (touch2.pageY - touch1.pageY) ** 2
      );

      if (initialDistance === null) {
        initialDistance = distance;
        return;
      }

      return distance / initialDistance;
    }

    let pinch_Start_Scale;
    let engine_Mobile_Zoom;

    this.canvas.canvas.addEventListener('touchstart', function handlePinchStart (event){
      event.preventDefault();

      pinch_Start_Scale = parsePinchScale(event);
      engine_Mobile_Zoom = eng.zoom;
    });

    this.canvas.canvas.addEventListener('touchmove', function handlePinch(event) {
      event.preventDefault();
      
      const scale = parsePinchScale(event);
      if (scale == null || pinch_Start_Scale == null || engine_Mobile_Zoom == null) return;

      eng.zoom = engine_Mobile_Zoom + (scale - pinch_Start_Scale);
    });

    this.canvas.canvas.addEventListener('touchend', function handlePinch(event) {
      event.preventDefault();
      engine_Mobile_Zoom = null;
      pinch_Start_Scale = null;
    });

		return this;
	}

	removeZoom = () => window.removeEventListener(eng.onZoom);

	resetOffset () {
		this.offset.cache.x = this.offset.x = 0;
		this.offset.cache.y = this.offset.y = 0;
	}

  setCursor (url) {
    const { canvas } = this.canvas;
    
    canvas.style.cursor = `url(${url}), pointer`;

    return this;
  }
}

export default engine;