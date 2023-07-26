export default function ({ kw }){
	return {
		[kw.id.print] ({ iter, data }) {
			const input = iter.next();
			
			if (!input.value) return;

			const results = [this.parseInput(iter, input, data)];

			while (iter.disposeIf(next => kw.is(next, kw.id.and)) && !iter.peek().done)
				results.push(
						this.parseInput(iter, iter.next(), data)
				);

			results.length > 0 && console.log(...results.map(e => this.trueValue(e)));
		},

		[kw.id.log_variables] ({ data }) {
			console.log('\n', `ORA LANG VARIABLES:`, '\n',  data.variables, '\n')
		},

		[kw.id.log_scope] ({ data }) {
			console.log('\n', `ORA LANG SCOPE:`, '\n', data, '\n')
		},
	};
};