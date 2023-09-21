
export class DataType {
	static Any = class Any {
		value;

		constructor (value){
			this.value = value;
		}
	};

	static String = class String extends DataType.Any {

	};

	static Number = class String extends DataType.Any {

	};

	static Object = class Object extends DataType.Any {

	}

	static Array = class Array extends DataType.Any {
		
	}
}