class Keyboard {
  pressed = {};
  events  = {};
  anyEvents = {};
    
  constructor(object = document.body) {
    object.addEventListener('keydown', e => this.simulateKeyDown(e.key));
    object.addEventListener('keyup', e => this.simulateKeyUp(e.key));
  }

  simulateKeyDown (keyIn){
    const key = (keyIn || '').toLowerCase();
    for (const func of Object.values(this.anyEvents))
      func(key);
    
    if (!this.isPressed(key) && typeof this.events[key] == 'object'){
      for (const func of Object.values(this.events[key]))
        func(key);
    }
    
    this.pressed[key] = true;
  }

  simulateKeyUp (key){
    delete this.pressed[(key || '').toLowerCase()];
  }

  on (key, [name, func]){
    const { events } = this;
    key = key.toLowerCase();

    events[key] ??= {};
    events[key][name] = func;
  }
  
  clearEvents (){
    this.events = {};
    this.anyEvents = {};
  }

  disconnect = function (key, name){
    key = key.toLowerCase();

    if (typeof this.events?.[key] == 'object')
      delete this.events[key][name];
  }

  anyPressed = function (...args) {
    return args.some(this.isPressed);
  }

  isPressed = (key = '') => this.pressed[key.toLowerCase()] == true || this.pressed[key] == true;
  
  intPressed = (key = '') => this.pressed[key.toLowerCase()] == true ? 1 : 0;

  mapInt (...keys) {
    const keyMap = key => [key?.toLowerCase(), this.intPressed(key?.toLowerCase())];

    return Object.fromEntries(
      keys.map(keyMap)
    );
  }

  applyKeys (keys){
    for (const [key, value] of Object.entries(keys)){
      if (!!value){
        this.simulateKeyDown(key);
      }
      else this.simulateKeyUp(key);
    }
  }
}

export default Keyboard;