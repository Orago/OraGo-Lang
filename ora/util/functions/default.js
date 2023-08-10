export default function (){
	const { keywords: kw, DataType } = this;
	const { isA_0 } = this.utils;

	return {
		[kw.id.comment]: () => ({ break: true }),
		
		[kw.id.return]: ({ iter, scope }) => this.parseInput(iter, iter.next(), scope),

		[kw.id.set] ({ iter, scope }) {
			const { variables: source } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : scope);
			const varname = iter.next().value;
			
			if (kw.has(varname))
				throw `Cannot set variable to function name: ${varname}`;
			
			let type = DataType.any;

			if (iter.disposeIf(next => kw.is(next, kw.id.as)))
				type = this.keywordToType(iter.next().value);

			if (isA_0(varname) ){
				if (iter.disposeIf(next => kw.is(next, kw.id.assign)))
					this.setOnPath({
						source,
						path: [varname, ...this.getPath({ iter, scope })],
						type,
						value: this.parseInput(iter, iter.next(), scope)
					});
					
				else 
					this.setOnPath({
						source,
						path: [varname, ...this.getPath({ iter, scope })],
						type,
						value: type.default
					});
			}

			else throw `Invalid Variable Name: (${varname})`;
		},

		[kw.id.shift] ({ iter, scope }) {
			const variable = this.expectSetVar({ iter, scope }, false);

			if (Array.isArray(variable.data))
				variable.data.shift();

			else if (typeof variable.data == 'object')
				delete variable.data[Object.keys(variable.data)[0]];
		},

		[kw.id.pop] ({ iter, scope }) {
			const variable = this.expectSetVar({ iter, scope }, false);

			if (Array.isArray(variable.data))
				variable.data.pop();

			else if (typeof variable.data == 'object'){
				const keys = Object.keys(variable.data);
				delete variable.data[keys[keys.length - 1]];
			}
		},

		[kw.id.push] ({ iter, data }) {
			const items = [this.parseInput(iter, iter.next(), scope)];

			while (iter.disposeIf(',') && parseInput(iter.clone(), iter.peek(1), scope) != null)
				items.push(
					parseInput(iter, iter.next(), scope)
				);

			const nextSeq = iter.next();

			if (nextSeq.done || !kw.is(nextSeq.value, kw.id.assign) || !isA_0(iter.peek(1).value))
				return;
			
			const variable = this.expectSetVar.bind(this)({ iter, scope });
			const { variables } = (iter.disposeIf(next => kw.is(next, kw.id.global)) ? this : scope);

			this.setOnPath({
				source: variables,
				path: variable.path,
				value: [...variable.data, ...items]
			});
		},
	};
};