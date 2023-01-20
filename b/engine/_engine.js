import repeater from './_repeater.js';
import keyboard from './_keyboard.js';
import cursor from './_cursor.js';

let end = false;

const difference = ( first, second ) => first - second > 0 ? first - second : (first - second) * -1;


const engineObject = function (data = {}){
	let obj = data;
	let rsl = this.renderListSize();

	obj.id = (rsl > 0 ? rsl : 1) * Date.now();

	obj.x ??= 0;
	obj.y ??= 0;
	obj.w ??= 0;
	obj.h ??= 0;
	obj.update ??= () => {};
	obj.onClick ??= () => {};
	obj.layer ??= 1;
	obj.lists ??= [];
	obj.visible = true;

	obj.pop = () => {
		[...obj.lists, this.renderList].forEach(list => {
			let renderPos = list.indexOf(obj);
			if (renderPos == -1) return;
			list.splice(renderPos, 1);
		})
	}

	obj.push = () => { 
		this.renderList.push(obj);

		for (const list of obj.lists)
			list.push(obj);

		return obj;
	}
	

	obj.canvas = this.canvas;

	obj.collides = (restriction = () => false) => {
		for (let otherObj of this.renderList)
			if (obj != otherObj
				&& restriction(obj, otherObj)
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
		let { x, y, w, h } = obj.scaled();
		let { offset: o } = this;

		x += o.x;
		y += o.y;

		return { x, y, w, h };
	}

	if (data.init) data.init(obj); 

	return obj;
}

const engine = class {
	constructor (canvas){
		this.renderList = []
		this.canvas = canvas;
		this.zoom = .5;
		this.offset = {
			x: 0, y: 0,
			cache: { x: 0, y: 0 }
		}
		this.panEnabled = false
		this.enabled = []

    canvas.canvas.setAttribute('tabindex', '1')
		
		this.cursor   = new cursor(canvas.canvas);
		this.keyboard = new keyboard(canvas.canvas);

		this.renderRepeater = new repeater();

		this.renderRepeater.update = () => {
			const { canvas, renderList } = this;

			canvas.clear();
			
			renderList.sort((a, b) => a.layer - b.layer)

			for (let i = 0; i < renderList.length; i++){
				let item = renderList[i];
				let { x, y, w, h, visible } = item;
				
				if (typeof item.update == 'function') item.update();

				x += item.offsetx;
				y += item.offsety;

				if (typeof item.render == 'function' && visible == true){
					item.render(x, y, w, h);
				}
			}
		}
		
		this.renderRepeater.start();

		this.cursor.click.objClicked = async (cursor) => {
			let endClick = false;

			await new Promise((r, e) => {
				if (this.panEnabled){
					let posCache = { ...cursor.pos },
							max = 20,
							check = d => difference(posCache[d], cursor.pos[d]) < max; 

					setTimeout(() => {
						(check('x') && check('y') ? r : e)();
					}, 300);
				}
				else r();
			}).catch($ => endClick = true);

			if (endClick) return;

			for (const obj of this.renderList){
				const clicked = this.collisionMath.rect(
					obj,
					cursor.pos
				);

				if (clicked == true){
          obj.onClick(cursor.pos);
          if (obj.button == true) break;
        }
			}
		}
	}

	renderListSize = () => Object.keys(this.renderList).length;

	collisionMath = {
		rect: (a, b) => {
			a.w = a.w || 0;            /* | */ a.h = a.h || 0;
			a.x2 = (a.x + a.w) || a.x; /* | */ a.y2 = (a.y + a.h) || a.y;
	
			b.w = b.w || 0;            /* | */ b.h = b.h || 0;
			b.x2 = (b.x + b.w) || b.x;
			b.y2 = (b.y + b.h) || b.y;
			
			return a.x < b.x2 && a.x2 > b.x && a.y < b.y2 && a.y2 > b.y;
		}
	};

	object = engineObject

	scaled (){
		const s = this.zoom;
		let { x, y, w, h } = obj;

		x *= s; y *= s;
		w *= s; h *= s;

		return { x, y, w, h };
	};

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

	allowZoom = () => {
		let eng = this;

		this.onZoom = function(e){
			if(e.deltaY > 0 && eng.zoom < 5)   eng.zoom += 0.05;
			if(e.deltaY < 0 && eng.zoom > 0.1) eng.zoom -= 0.05;
		};

		window.addEventListener('mousewheel', eng.onZoom, false);

		return this;
	}

	removeZoom = () => window.removeEventListener(eng.onZoom);

	allowPan = () => {
		let dragTimer;

		const { canvas, offset } = this;

		canvas.cursor.click.pan = cursor => {

			if (dragTimer != false) clearInterval(dragTimer);
		
			dragTimer = setInterval(() => {
				offset.x = offset.cache.x + cursor.pos.x - cursor.start.x;
				offset.y = offset.cache.y + cursor.pos.y - cursor.start.y;
			}, 0);
		}
		
		canvas.cursor.release.pan = () => {
			offset.cache.x = offset.x;
			offset.cache.y = offset.y;

			clearInterval(dragTimer);
		}

		this.panEnabled = true;

		return this;
	}

	removePan = () => {
    const { cursor } = this.canvas;

		delete cursor.click.pan;
		delete cursor.release.pan;
	}

	resetOffset = () => {
		this.offset.cache.x = this.offset.x = 0;
		this.offset.cache.y = this.offset.y = 0;
	}

  setCursor = (url) => {
    const { canvas } = this.canvas;
    
    canvas.style.cursor = `url(${url}), pointer`;

    return this;
  }
}

export default engine;