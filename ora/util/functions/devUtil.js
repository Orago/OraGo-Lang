export default function (){
	const { keywords: kw } = this;

	return {
		[kw.id.exit]: () => process.exit(),
		[kw.id.log_variables] ({ data }) {
			console.log('\n', `ORA LANG VARIABLES:`, '\n',  data.variables, '\n')
		},

		[kw.id.log_scope] ({ data }) {
			console.log('\n', `ORA LANG SCOPE:`, '\n', data, '\n')
		},
	};
};