

module.exports = (expressApp) => {
	// setTimeout(() => expressApp.listen(3000), 6000);
	return (path, func) => {
		

		return expressApp.get(path, function (req, res){
			func(req, res);
		});
	}
}
