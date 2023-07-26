import { newNode as n, qs } from './dom.js';

export default class joystick {
  outerStyles = {
    background: `rgb(${[0, 0, 0].map($ => 255 / 2).join(' ')}/.5)`,
    width: '50px',
    aspectRatio: '1 / 1',
    borderRadius: '50%'
  }

  draggableStyles = {
    background: `rgb(${[0, 0, 0].map($ => 255 / 2).join(' ')}/.5)`,
    aspectRatio: '1 / 1',
    borderRadius: '50%',
    border: '3px solid white',
    position: 'absolute'
  }

  constructor(el, data = {}) {
    const { radius, onDown, onMove, onUp } = data;

    this.container = typeof el === 'string' ? qs(el) : el;
    this.draggable = n.div;

    this.dragStart = null;
    this.maxDistance = 64;
    this.deadzone = 8;

    // track touch identifier in case multiple joysticks present
    this.touchId = null;

    this.active = false;
    this.value = { x: 0, y: 0 };
    this.scaleOfDraggable = .8;

    if (typeof radius == 'number')
      this.outerStyles.width = radius + 'px';

    if (typeof onDown == 'function') this.onDown = onDown;
    if (typeof onMove == 'function') this.onMove = onMove;
    if (typeof onUp == 'function')   this.onUp = onUp;

    this.init();

    window.stick = this;
  }

  init() {
    const { container, draggable } = this;
    const { outerStyles, draggableStyles } = this;

    container.styles( outerStyles );

    draggable.styles( draggableStyles );

    container(draggable);

    const event = {
      handleDown: event => this.handleDown(event),
      handleMove: event => this.handleMove(event),
      handleUp: event => this.handleUp(event)
    }
    
    draggable.on('mousedown',  event.handleDown);
    draggable.on('touchstart', event.handleDown);

    const events = [
      ['mousemove', event.handleMove, { passive: false }],
      ['touchmove', event.handleMove, { passive: false }],
      ['mouseup', event.handleUp],
      ['touchend', event.handleUp],
    ];

    draggable.observer({
      onAdd (){
        for (const eventData of events)
          document.addEventListener(...eventData);
      },
      onRemove (){
        for (const [listener, func] of events)
          document.removeEventListener(listener, func);
      }
    })
    
    setTimeout(() => this.resetDraggable(), 10);
  }

  handleDown(event) {
    // touch event fired before mouse event; prevent redundant mouse event from firing
    event.preventDefault();

    this.resizeDraggable();
    this.active = true;
    // all drag movements are instantaneous
    this.draggable.style.transition = '0s';



    this.dragStart = (
      event.changedTouches ?
      {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY
      } :
      { x: event.clientX, y: event.clientY }
    );

    // if this is a touch event, keep track of which one
    if (event.changedTouches)
      this.touchId = event.changedTouches[0].identifier;

    if (typeof this.onDown == 'function') this.onDown(this);
  }

  handleMove(event) {
    if (!this.active) return;
    const { maxDistance, deadzone } = this;

    // if this is a touch event, make sure it is the right one
    // also handle multiple simultaneous touchmove events
    let touchmoveId = null;

    if (event.changedTouches) {
      let i = 0;

      for (const touch of event.changedTouches){
        i++;
        if (this.touchId == touch.identifier) {
          touchmoveId = i;
          event.clientX = touch.clientX;
          event.clientY = touch.clientY;
        }
      }

      if (touchmoveId == null) return;
    }

    const xDiff = event.clientX - this.dragStart.x;
    const yDiff = event.clientY - this.dragStart.y;
    const angle = Math.atan2(yDiff, xDiff);
    const distance = Math.min(maxDistance, Math.hypot(xDiff, yDiff));
    const xPosition = distance * Math.cos(angle);
    const yPosition = distance * Math.sin(angle);

    // move stick image to new position
    this.draggable.styles({
      transform: `translate3d(${xPosition}px, ${yPosition}px, 0px)`
    });

    // deadzone adjustment
    const distance2 = (distance < deadzone) ? 0 : maxDistance / (maxDistance - deadzone) * (distance - deadzone);
    const xPosition2 = distance2 * Math.cos(angle);
    const yPosition2 = distance2 * Math.sin(angle);
    const xPercent = parseFloat((xPosition2 / maxDistance).toFixed(4));
    const yPercent = parseFloat((yPosition2 / maxDistance).toFixed(4));

    this.value = { x: xPercent, y: yPercent };
    
    if (typeof this.onMove == 'function') this.onMove(this);
  }

  handleUp(event){
    if (typeof this.onUp == 'function') this.onUp(this);

    if ( !this.active ) return;
    // if this is a touch event, make sure it is the right one
    if (
      event.changedTouches &&
      this.touchId != event.changedTouches[0].identifier
    ) return;

    // transition the joystick position back to center
    this.resetDraggable();

    // reset everything
    this.touchId = null;
    this.active = false;


    this.value = { x: 0, y: 0 };
  }

  resizeDraggable (){
    const bounds = this.container.node.getBoundingClientRect();
    const width = bounds.width * this.scaleOfDraggable;

    this.deadzone = bounds.width / 4;
    this.draggable.style.width = `${width}px`;

    return width;
  }

  resetDraggable() {
    const width = this.resizeDraggable();

    this.draggable.styles({
      transition: '.2s',
      transform: `translate(${width / 8}px, ${width / 8}px)`
    });
  }

  get toSimple (){
    const { x , y } = this.value;

    return [x > 0, y > 0];
  }

  get toWasd (){
    const { x, y } = this.value;
    
    return {
      w: y < 0,
      s: y > 0,
      a: x < 0,
      d: x > 0
    };
  }

  applyToKeyboard (keyboard){
    keyboard.applyKeys(this.toWasd);
  }
}
