


export default function (){
	const { keywords: kw, DataType} = this;
	const { isA_0 } = this.utils;

	return {
		[kw.id.comment]: () => ({ break: true }),
		
		[kw.id.return]: ({ iter, data }) => this.parseInput(iter, iter.next(), data),

		[kw.id.set] ({ iter, data }) {
			const { variables: source } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : data);
			const varname = iter.next().value;
			
			if (kw.has(varname))
				throw `Cannot set variable to function name: ${varname}`;
			
			let type = DataType.any;

			if (iter.disposeIf(next => kw.is(next, kw.id.as)))
				type = this.keywordToType(iter.next().value);

			if (isA_0(varname) && iter.disposeIf(next => kw.is(next, kw.id.assign))){
				this.setOnPath({
					source,
					path: [varname, ...this.getPath({ iter, data })],
					type,
					value: this.parseInput(iter, iter.next(), data)
				});
			}

			else throw `Invalid Variable Name: (${varname}), or next sequence (${iter.stack()[0]})`;
		},

		[kw.id.shift] ({ iter, data }) {
			const variable = this.expectSetVar({ iter, data }, false);

			if (Array.isArray(variable.data))
				variable.data.shift();

			else if (typeof variable.data == 'object')
				delete variable.data[Object.keys(variable.data)[0]];
		},

		[kw.id.pop] ({ iter, data }) {
			const variable = this.expectSetVar({ iter, data }, false);

			if (Array.isArray(variable.data))
				variable.data.pop();

			else if (typeof variable.data == 'object'){
				const keys = Object.keys(variable.data);
				delete variable.data[keys[keys.length - 1]];
			}
		},

		[kw.id.push] ({ iter, data }) {
				const items = [this.parseInput(iter, iter.next(), data)];

				while (iter.disposeIf(',') && parseInput(iter.clone(), iter.peek(1), data) != null)
					items.push(
						parseInput(iter, iter.next(), data)
					);

				const nextSeq = iter.next();

				if (nextSeq.done || !kw.is(nextSeq.value, kw.id.assign) || !isA_0(iter.peek(1).value))
					return;
				
				const variable = this.expectSetVar.bind(this)({ iter, data });
				const { variables } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : data);

				this.setOnPath({
					source: variables,
					path: variable.path,
					value: [...variable.data, ...items]
				});
			},
	};
};