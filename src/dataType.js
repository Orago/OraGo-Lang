
export class DataType {
	static Any = class Any {
		value;

		constructor (value){
			this.value = value;
		}

		valueOf (){
			return this;
		}
	};



	static String = class String extends DataType.Any {
		valueOf (){
			return this.value + '';
		}
	};

	static Number = class String extends DataType.Any {
		valueOf (){
			return Number(this.value);
		}
	};

	// Shouldn't be created on it's own
	static Object = class Object extends DataType.Any {
		valueOf (){
			const entries = Object.entries(this.value);

			return entries.map(([key, value]) => {
				if (value instanceof DataType.Any)
					return [key, value.valueOf()];

				else return [key, value];
			});
		}
	}

	static Array = class Array extends DataType.Any {
		valueOf (){
			return this.value.map((value) => {
				if (value instanceof DataType.Any)
					return value.valueOf();

				else return value;
			});
		}
	}
}

class deez {
	[Symbol.toPrimitive](hint) {
		return 5;
	}
}
+new deez() 