export default class keyboard {
  constructor(object = document.body) {
    this.keysPressed = {};
    this.onkey = function () {};

    object.addEventListener('keyup', e => {
      delete this.keysPressed[e.key];
    });
    
    object.addEventListener('keydown', e => {
      let k = (e.key || '').toLowerCase();

      if (this.isPressed(k) == false)
        this.onkey(k);
      this.keysPressed[k] = true;
    });
  }

  anyPressed = function (...args) {
    for (const key of args)
      if (this.isPressed(key))
        return true;

    return false;
  }

  isPressed = (e='') => this.keysPressed[e.toLowerCase()] == true;
}