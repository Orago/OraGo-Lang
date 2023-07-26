


export default function (){
	const { keywords: kw, DataType} = this;
	const { isA_0 } = this.utils;

	return {
		[kw.id.comment]: () => ({ break: true }),
		[kw.id.set] ({ iter, data }) {
			const { variables: source } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : data);
			const path = [iter.next().value];
			
			if (kw.has(path[0]))
				throw `Cannot set variable to function name: ${path[0]}`;

			while (iter.disposeIf('.') && isA_0(iter.peek(1).value))
				path.push(
					iter.next().value
				);
			
			let type = DataType.any;

			if (iter.disposeIf(next => kw.is(next, kw.id.as)))
				type = this.keywordToType(iter.next().value);

			if (isA_0(path[0]) && iter.disposeIf(next => kw.is(next, kw.id.assign))){
				this.setOnPath({
					source,
					path,
					type,
					value: this.parseInput(iter, iter.next(), data)
				});
			}

			else throw `Invalid Variable Name: (${path[0]}), or next sequence (${iter.stack()[0]})`;
		},

	};
};