export class DataType {
	static Any = class Any {
		constructor (value){
			this.value = value;
		}

		valueOf (){ return this.value; };
	};

	static String = class String extends DataType.Any {
		valueOf (){ return this.value + ''; }
	};

	static Number = class Num extends DataType.Any {
		valueOf (){ return Number(this.value); }
	};

	// Shouldn't be created on it's own
	static Object = class Object extends DataType.Any {
		valueOf (){
			return Object.entries(this.value).map(([key, value]) => [
				key, 
				value instanceof DataType.Any ? value.valueOf() : value
			]);
		}
	}

	static Array = class Array extends DataType.Any {
		valueOf (){
			return this.value.map(
				value => value instanceof DataType.Any ? value.valueOf() : value
			);
		}
	}

	static simple (input){
		return input instanceof DataType.Any ? input.valueOf() : input;
	}
}