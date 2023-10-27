export class Scope {
	data = {};

	constructor (parent){
		if (parent instanceof Scope)
			this.parent = parent;
	}

	get flat (){
		let dataOut = this.data;
		let scope = this;

		while (scope?.parent != undefined)
			dataOut = Object.assign({}, (scope = scope.parent).data, dataOut);

		return dataOut;
	}
}