export default class VariableObserver {
  listeners = [];
  #value;

  constructor (defaultValue) {
    this.#value = defaultValue;
  }

  setValue(newValue) {
    if (this.validate(newValue)) {
      this.#value = this.sanitize(newValue);
      this.notifyListeners(newValue);
    }
  }

  getValue() {
    return this.#value;
  }

	once (callback){
		const calledOnce = () => {
			callback(this.#value);

			this.unsubscribe(calledOnce);
		};

		this.listeners.push(calledOnce)
	}

  subscribe(callback) {
    if (this.#value != null)
      callback(this.#value);

    this.listeners.push(callback);
  }

  unsubscribe(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners(newValue) {
    this.listeners.forEach(listener => listener(newValue));
  }

  get value (){
    return this.#value;
  }

  set value (input){
    return this.setValue(input);
  }

  validate (newValue){
    return this.#value !== newValue;
  }

  sanitize (newValue){
    return newValue;
  }
}