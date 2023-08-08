export default function (){
	const { keywords: kw } = this;

	return {
		[kw.id.exit]: () => process.exit(),
		[kw.id.log_variables] ({ scope }) {
			console.log('\n', `ORA LANG VARIABLES:`, '\n',  scope.variables, '\n')
		},

		[kw.id.log_scope] ({ scope }) {
			console.log('\n', `ORA LANG SCOPE:`, '\n', scope, '\n')
		},
	};
};