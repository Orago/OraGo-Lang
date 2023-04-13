

module.exports = (expressApp) => (path, func) => {
	setTimeout(() => expressApp.listen(3000), 2000);

	return expressApp.get(path, function (req, res){
		// res.send = res.send.bind(res);
		func(req, res);
	});
}
