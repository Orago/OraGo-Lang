class MagicMath {
  constructor(value) {
    this.value = value;
  }

  valueOf() {
    // Override the valueOf method to return a custom behavior for mathematical operations
    return this.value;
  }

  toString() {
    // Override the toString method to return a custom string representation
    return `MagicMath(${this.value})`;
  }

	get cat (){
		return 'meow';
	}
}

const magicInstance = new MagicMath(5);

console.log(magicInstance * 3, magicInstance.cat); // Outputs: 15 (uses the overridden valueOf method)
console.log(String(magicInstance)); // Outputs: MagicMath(5) (uses the overridden toString method)
