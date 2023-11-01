
class AnyType {
	constructor (value){
		this.value = value;
	}

	valueOf (){ return this.value; };
};

class StringType extends AnyType {
	valueOf (){ return this.value + ''; }
}

class NumberType extends AnyType {
	valueOf (){ return Number(this.value); }
};

class ObjectType extends AnyType {
	valueOf (){
		return Object.entries(this.value).map(([key, value]) => [
			key, 
			value instanceof AnyType ? value.valueOf() : value
		]);
	}
}

class ArrayType extends AnyType {
	valueOf (){
		return this.value.map(
			value => value instanceof AnyType ? value.valueOf() : value
		);
	}
}

export class DataType {
	static Any = AnyType;
	static String = StringType;
	static Number = NumberType;
	static Object = ObjectType;
	static Array = ArrayType;

	static simplify (input){
		return input instanceof AnyType ? input.valueOf() : input;
	}
}