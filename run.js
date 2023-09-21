import Ora, { CustomKeyword, CustomFunction, ValueProcessor, Extension } from './src/main.js'


const oraComment = new Extension({
	keyword: new CustomKeyword('comment', ['comment', '#']),
	function: new CustomFunction('comment', function () {
		return ({ break: true });
	})
});

const toylang = new Ora({
	extensions: [
		oraComment
	]
});

toylang.run(`
	fn catto {
		print "hello";
	}
`);