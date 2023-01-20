
const flatLang = inputs => {
	const text = inputs[0].replace(/\n\n/g, '\n').replace(/\t\t/g, '\t').replace(/^\n/g, '');
	console.log([text])
}

flatLang`
cat:
	echo('meow');
`