import { Repeater } from './_repeater.js';
const privateDataKey = '🐈_!private&&!data';
const enforcer = (type, value) => typeof new type().valueOf() === typeof value && value !== null ? value : new type().valueOf();
const difference = (first, second) => first - second > 0 ? first - second : (first - second) * -1;

const forceTypeModule = {
  forceNull:    $ => null,
  forceBoolean: $ => enforcer(Boolean, $),
  forceNumber:  $ => enforcer(Number, isNaN($) ? false : Number($)),
  forceBigInt:  $ => enforcer(BigInt, $),
  forceString:  $ => enforcer(String, $),
  forceObject:  $ => enforcer(Object, $),
  forceArray:   $ => Array.isArray($) ? $ : []
}

const { forceArray } = forceTypeModule;

const rectCollides = (rect1, rect2) => {
  if (
    rect1.x + rect1.w > rect2.x &&
    rect1.x < rect2.x + rect2.w &&
    rect1.y + rect1.h > rect2.y &&
    rect1.y < rect2.y + rect2.h
  ) return true; // Collision detected

  return false; // No collision
}


function enterFullscreen (element){
	if (element.requestFullScreen) /* Default */
    element.requestFullScreen();    

	else if (element.webkitRequestFullscreen) /* Safari  */
    element.webkitRequestFullscreen(); 

  else if (element.mozRequestFullscreen) /* Firefox */
    element.mozRequestFullscreen();
  
	else if (element.msRequestFullscreen) /* IE11 */
    element.msRequestFullscreen();

	return element;
}

function exitFullscreen() {
  if (document.exitFullscreen) /* Default */
    document.exitFullscreen();

  else if (document.webkitExitFullscreen) /* Safari */
    document.webkitExitFullscreen();
    
  else if (document.mozCancelFullScreen) /* Firefox */
    document.mozCancelFullScreen();

  else if (document.msExitFullscreen) /* IE/Edge */
    document.msExitFullscreen();
}


function isElementFullscreen(element) {
  if (document.fullscreenElement === element ||
      document.webkitFullscreenElement === element ||
      document.mozFullscreenElement === element ||
      document.msFullscreenElement === element) {
    return true;
  }
  return false;
}

Function.prototype.clone = function() {
  const cloneObj = this.__isClone ? this.__clonedFrom : this;
  const temp     = () => cloneObj.apply(this, arguments);

  for (const key in this) temp[key] = this[key];

  temp.__isClone = true;
  temp.__clonedFrom = cloneObj;

  return temp;
};

function isElement(obj) {
  try { return obj instanceof HTMLElement; }
  catch(e){
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have (works on IE7)
    return (typeof obj==="object") &&
      (obj.nodeType===1) && (typeof obj.style === "object") &&
      (typeof obj.ownerDocument ==="object");
  }
}

// const recieveDraggedElement = ;
const dragRecieverChannels = {};

function dragMoving (node, x, y){
  node[privateDataKey].dragPreventClick = true;

	node.styles({
		position: 'absolute',
		left: x + 'px',
		top: y + 'px',
    zIndex: 50
	});
}

function dragDrop (node, x, y){
	const nodeChannel = node[privateDataKey]?.dragChannel;

	if (dragRecieverChannels.hasOwnProperty(nodeChannel))
		for (const containerNode of dragRecieverChannels[nodeChannel]){
			if (containerNode == null) continue;

			const { bounds } = containerNode;

      setTimeout(() => delete node[privateDataKey].dragPreventClick, 200);

			if (rectCollides({ x: bounds.x + scrollX, y: bounds.y + scrollY, w: bounds.width, h: bounds.height }, { x, y, w: node.bounds.width, h: node.bounds.height })){
				containerNode.node.dispatchEvent(
					new CustomEvent('recieve_drag_element', { detail: { node } })
				);
			}
		}

	node.removeStyles('position', 'left', 'top', 'z-index');
}


const addListenersToNode = (node, events) => {
	node.listeners ??= {};
	const { listeners: group } = node;
	
	for (const key in events)
		for (const listener in events[key]){
      if (listener == 'keypress' || listener == 'keydown' || listener == 'keyup')
        node.attr({ tabindex: 0 });

			const func = events[key][listener].bind(node);
				
			group[key] ??= {};
			group[key][listener] = func;

			node.events ??= {};
			node.events[listener] ??= [];
			node.events[listener].push(func);

			node.node.addEventListener(listener, func);
		}

	return this;
}

const removeListenersFromNode = (node, key) => {
	node.listeners ??= {};
	const { listeners: group } = node;

	for (const listener in group[key])
		node.node.removeEventListener(listener, group[key][listener]);

	return this;
}

const utilFunctionsOverride = {
  append (...objs){
    if (objs.length < 1) return;

    for (const el of objs)
      if (Array.isArray(el))
        objs.splice(objs.indexOf(el), 1, ...el);
      
    for (const el of objs){
      if (el == false) continue;
      
      this.node.append(
        el?.constructor == '_M_NODE' && !isElement(el) ? el.node : el
      );
    }
      
    return this;
  },

  appendTo (obj){
    if (!obj) return;

    const { node: el } = this;

    obj.append(
      el?.constructor == '_M_NODE' && !isElement(el) ? el.node : el
    );

    return this;
  },

  prependTo (obj){
    if (!obj) return;

    const { node: el } = this;

    obj.prepend(
      el?.constructor == '_M_NODE' && !isElement(el) ? el.node : el
    );

    return this;
  },

  prepend (...objs){
    if (objs.length < 1) return;

    for (let el of objs)
      if (Array.isArray(el)){					
        const i = objs.indexOf(el);

        objs.splice(i, i + el.length);
        objs.push(...el);
      }

    for (const el of objs)
      this.node.prepend(
        el?.constructor == '_M_NODE' && !isElement(el) ? el.node : el
      );
    
    return this;
  },

  focus (){
    setTimeout(() => this.node.focus(), 0);

    return this;
  },

  scroll (x = 0, y = 0){
    const options = {
      bottom: this.node.scrollHeight
    };

    setTimeout(() => this.node.scroll(
      options[x] ?? x,
      options[y] ?? y
    ), 500);

    return this;
  }
}

const utilFunctions = {
  text (content){
    this.node.textContent = content;

    return this;
  },

  attr (attributes = {}){
    if (typeof attributes != 'object') return;

    for (const [key, value] of Object.entries(attributes))
      this.node.setAttribute(key, value);
    
    return this;
  },

  styles (styles = {}){
    if (typeof styles != 'object') return;

    for (const [key, value] of Object.entries(styles)){
      if (key === 'props')
        for (const [propKey, propValue] of Object.entries(value))
          this.node.style.setProperty(`--${propKey}`, propValue);

      this.node.style[key] = value;
    }
    
    return this;
  },

	removeStyles (...styles){
    for (const style of styles)
      this.node.style.removeProperty(style);
    
    return this;
	},

  class (...args){
    this.node.className = args.join(' ');

    return this;
  },

  hasClass (className){
    return this.node.classList.contains(className);
  },
  
  addClass (...args) {
    for (const arg of args)
      if (arg.includes(' '))
        args.splice(args.indexOf(arg), 1, ...arg.split(' '));
      else if (Array.isArray(arg))
        args.splice(args.indexOf(arg), 1, ...arg);

    this.node.classList.add(...forceArray(args));

    return this;
  },

  removeClass (...args) {
    for (const arg of args)
      if (arg.includes(' '))
        args.splice(args.indexOf(arg), 1, ...arg.split(' '));

    this.node.classList.remove(...forceArray(args));

    return this;
  },

  toggleClass(className, status = !this.hasClass(className)){
    status ? this.addClass(className) : this.removeClass(className);
    return this;
  },

  fullscreen (enable = !isElementFullscreen(this.node)){
    if (enable) enterFullscreen(this.node);
    else exitFullscreen();
    
    return this;
  },

  swap (el){
    const newNode = el?.constructor == '_M_NODE' ? el.node : el;
    
    this.node.replaceWith(newNode);
    this.node = newNode;

    return this;
  },

  clone (){
    return generateProxyNode(this.node.cloneNode(true));
  },

  clear (){
    this.innerHTML = '';

    return this;
  },

  on (event, func) {
    addListenersToNode(this, {
      temp: {
        [event]: func
      }
    });

    return this;
  },

  addListener (events) {
    addListenersToNode(this, events);

    return this;
  },

  removeListener (key) {
    removeListenersFromNode(this, key);

    return this;
  },

  id (value){
    this.node.id = value;
    
    return this;
  },

  wrapper(run){
    run (this);

    return this;
  },

  exists (){
    return document.body.contains(this.node);
  },

  interval (func, time = 1000, immediate = false){
    const toCall = () => func.bind(this)(this, () => clearInterval(tempInterval));
    if (immediate) toCall();

    let tempInterval = setInterval(toCall, time);

		this.observer({
			onRemove: () => clearInterval(tempInterval)
		});

    return this;
  },

	repeater (fps = 32, func){
		const tempRepeater = new Repeater(fps, () => {
			func.bind(this)(this, () => tempRepeater.pause(true));
		});

		tempRepeater.start();

		this.observer({
			onRemove: () => tempRepeater.pause(true)
		});

    return this;
  },

	observer (methods, killOnRemove = true){
		let in_dom = document.body.contains(this.node);

		const tempObserver = new MutationObserver(() => {
      
      if (document.body.contains(this.node)) {
        if (!in_dom && typeof methods.onAdd == 'function')
					methods.onAdd.bind(this)(this);
        
        in_dom = true;
      }
      else if (in_dom) {
        in_dom = false;

				if (typeof methods.onRemove == 'function')
					methods.onRemove.bind(this)(this);
				
				if (killOnRemove == true)
					tempObserver.disconnect();
      }
    })
		
		tempObserver.observe(document.body, { childList: true, subtree: true });

		return this;
	},

	childOfDragChannel (channel = 'default'){
		if (this[privateDataKey].dragChannel == null){
      
      let startX;
      let startY;
      let deadzone = 5;

			this[privateDataKey].dragging = false;

			this.styles({ userSelect: 'none' });

      let touchX, touchY;
      const mobileHoldTime = 250; // milliseconds
      let mobileCanDrag = false;
      let mobileTimer;
      
			this
				.on('touchmove', function (event){
					const touch = event.targetTouches[0];
          const { bounds: b } = this;

          touchX = touch.pageX - b.width / 2;
          touchY = touch.pageY - b.height / 2;

          if (
            mobileCanDrag != true ||
            difference(startX, touchX) < deadzone &&
            difference(startY, touchY) < deadzone
          ) return;

          if (event.cancelable) {
            event.preventDefault(); // Prevent touchmove if cancelable
          }

					dragMoving(this, touchX, touchY);
				})
        .on('touchstart', function (event){
          const touch = event.targetTouches[0];
          const { bounds: b } = this;
          let startScrollY = window.scrollY;

          mobileTimer = setTimeout(() => {
            if (difference(startScrollY, window.scrollY) > deadzone)
              return console.log('canceled');
              
            mobileCanDrag = true
          }, mobileHoldTime);

          startX = touch.pageX - b.width / 2;
          startY = touch.pageY - b.height / 2;
          
          this[privateDataKey].dragging = true;
        })
				.on('touchend', function (){
          this[privateDataKey].dragging = false;

          mobileCanDrag = false;

          if (mobileTimer)
            clearTimeout(mobileTimer);

					dragDrop(this, touchX, touchY);
				});

			this

				.on('mousemove', function (event) {
					if (this[privateDataKey].dragging != true) return;
          const { bounds: b } = this;

          if (
            difference(startX, event.pageX - b.width / 2) < deadzone &&
            difference(startY, event.pageY - b.height / 2) < deadzone
          ) return;
					
          dragMoving(this, event.pageX - b.width / 2, event.pageY - b.height / 2);
				})
				.on('mousedown', (event) => {
          const { bounds: b } = this;

          startX = event.pageX - b.width / 2;
          startY = event.pageY - b.height / 2;

          this[privateDataKey].dragging = true;
        })
				.on('mouseup', function (event){
					this[privateDataKey].dragging = false;
          setTimeout(() => this[privateDataKey].dragPreventClick = false, 100);


          const { bounds: b } = this;

					dragDrop(this, event.pageX - b.width / 2, event.pageY - b.height / 2);
				})
        .on('mouseleave', function (){
          this[privateDataKey].dragging = false;
          setTimeout(() => this[privateDataKey].dragPreventClick = false, 100);

          this.removeStyles('position', 'left', 'top', 'z-index');
        })
		}

		this[privateDataKey].dragChannel = channel;

		return this;
	},

	listenDragChannel (channel = 'default'){
		dragRecieverChannels[channel] ??= [];

		if (dragRecieverChannels[channel].includes(this) != true)
			dragRecieverChannels[channel].push(this);

		return this;
	},

	unlistenDragChannel (channel = 'default'){
		if (Array.isArray(dragRecieverChannels[channel]) && dragRecieverChannels[channel].includes(this))
			dragRecieverChannels[channel] = dragRecieverChannels[channel].filter(node => node != this);

		return this;
	},

  get ref (){
    return this.wrapper;
  },

  getChildren (){
    return [...this.node.children].map(documentEl => generateProxyNode(documentEl));
  }
}

class createUtilsGetter {
  constructor (node){
    this.node = node;
  }

  get focused (){
    return document.activeElement === this.node;
  }

  get childFocused (){
    return this.focused || this.node.contains(document.activeElement);
  }

	get bounds (){
		return this.node.getBoundingClientRect()
	}

  get parent (){
    return generateProxyNode(this.node.parentElement);
  }
}

const elUtils = {
  function: utilFunctions,
  overrideFunction: utilFunctionsOverride
};

function generateProxyNode (el){
	el.constructor = '_M_NODE';

  const selfElUtils = {
    get: new createUtilsGetter(el)
  };

	let nodeData = {};
	const privateData = {};

	if (!isElement(el))
		return new Proxy({}, { get () { return; }, set () { return {}; } });
    
	const nodeProxy = new Proxy(() => 0, {
		apply (fnc, thisArg, argumentsList){
			return elUtils.overrideFunction.append.bind(nodeProxy)(...argumentsList);
		},

		get (fnc, prop) {
			if (prop === 'node') return el;
			if (prop === 'data') return nodeData;
			if (prop === '🐈_!private&&!data') return privateData;

			if (elUtils.overrideFunction.hasOwnProperty(prop))
				return elUtils.overrideFunction[prop].bind(nodeProxy);

			if (prop in el) return typeof el[prop] == 'function' ? el[prop].bind(el) : el[prop];

			if (elUtils.function.hasOwnProperty(prop))
				return elUtils.function[prop].bind(nodeProxy);

      if (selfElUtils.get?.[prop] != null)
        return selfElUtils.get[prop];
		},
		set (fnc, prop, value) {
			if (prop === 'node') el = value;
			if (prop == 'data') nodeData = value;

			return Reflect.set(el, prop, value);
		}
	})

	return nodeProxy;
}

const newNode = new Proxy({}, {
	get (target, elementTag) {
    return generateProxyNode(
			document.createElement(elementTag)
		);
  }
});

const qs = (selector, element = document) => {
  const currentNode = element.querySelector(selector);

  return currentNode ? generateProxyNode(currentNode) : null;
}

const qsAll = (selector, element = document) => {
	return [...element.querySelectorAll(selector)].map(
		$ => $ ? generateProxyNode($) : newNode.div
	);
}

const fetch = async ({ url, format }, options) => {
	const res = await fetch(url, options);

	try { const jsonData = await res.json(); }
	catch (e){ console.log(e); }

	e.json = () => e.response.json();
	e.text = () => e.response.text();

	return e;
}

const urlRegexValidation = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g;

const url = class _M_Url {
	constructor(urlInput = window.location.href){
		this.url = new URL(urlInput);
		this.settings = {}
	}

	async fetch (data, options) {
		this.response = await fetch(data?.url, options);

		this.json = () => this.response.json();
		this.text = () => this.response.text();

		return this;
	}

	get valid (){
		return urlRegexValidation.test(this.url);
	}

	get params (){
		return this.url.searchParams;
	}

	get pathArray (){
		const { pathname: pn } = this.url;
		const paths = pn.startsWith('/') ? pn.replace('/', '').split('/') : pn.split('/');
		const pathsnf = [];

		for (const item of paths)
			if (!item.includes('.'))
				pathsnf.push(item);

		return pathsnf;
	}

	query (replace = false) {
		const { searchParams } = this.url;
		
		return {
			set (key, value) {
				const params = searchParams;
				
				params.has(key) && params.delete(key);
				params.append(key, value);

				const newUrl = window.origin + '?' + params.toString();

				replace == true && window.history.replaceState({ path: newUrl }, '', newUrl);

				return newUrl;
			},

			get (key){
				return searchParams.get(key)
			},

			get obj () {
				return searchParams
			},

			clear () {
				if (replace == true)
					window.history.replaceState(
						{ path: window.origin },
						'',
						window.origin
					);
			}
		}
	}
}



export default {
	newNode,
	qs,
	generateProxyNode,
	fetch
}

export {
	newNode,
	qs,
	qsAll,
	generateProxyNode,
	fetch,
  isElement,
	url,
  privateDataKey
}