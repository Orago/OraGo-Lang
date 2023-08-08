
class anyTypeValue {
	#value;
	static default;

	constructor (value){
		this.value = value ?? this.default;
	}

	validate (){
		return true;
	}

	sanitize (value){
		return value;
	}

	error (){
		return 'Failed to set value';
	}

	get value (){
		return this.#value;
	}

	set value (newValue){
		if (this.validate(newValue) != true)
			throw this.error(newValue);

		this.#value = newValue;
	}
}

class numberTypeValue extends anyTypeValue {
	static default = 0;

	error (){
		return 'Input is not an number';
	}

	sanitize (value){
		return Number(value);
	}

	validate (value){
		return !isNaN(value);
	}
}

class stringTypeValue extends anyTypeValue {
	static default = '';

	error (){
		return 'Input is not an string';
	}

	validate (value){
		return typeof value == 'string';
	}
}

class arrayTypeValue extends anyTypeValue {
	static default = [];

	error (){
		return 'Input is not an array';
	}

	validate (value){
		return Array.isArray(value);
	}
}

class objectTypeValue extends anyTypeValue {
	static default = {};
	
	error (){
		return 'Input is not an object';
	}

	validate (value){
		return typeof value == 'object';
	}
}

class boolTypeValue extends anyTypeValue {
	static default = false;

	error (){
		return 'Input is not an boolean';
	}

	validate (value){
		return typeof value == 'boolean';
	}
}

const OraType = {
	any: anyTypeValue,
	number: numberTypeValue,
	string: stringTypeValue,
	array: arrayTypeValue,
	object: objectTypeValue,
	bool: boolTypeValue
};

export default OraType;