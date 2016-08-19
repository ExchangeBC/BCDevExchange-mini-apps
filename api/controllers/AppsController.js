
var github = require('octonode');
var yaml = require('js-yaml');
var getCached = false;
var myCached = require ('../services/cached.json');

var aok = function (res) { return function (o) {res.json (o);}};
var nok = function (res) { return function (e) {res.json (e);}};

module.exports = {

	openIssues: function (req, res) {
		// sails.log.debug("getCommits request body", req.param('widget'));
		var widget = req.param('widget');
		GithubService.getCommits(widget, function (err, data, headers) {
			return res.json(data);
		});
	},
	issues: function (req, res) {
		if (getCached) return res.json (myCached);
		var program = req.params.program || '';
		console.log ('gathering issues for program: '+program);
		ProgramService.getIssues (program)
		.then (ProgramService.categorizeIssues)
		.then (aok (res), nok (res));
	},
	getCards: function (req, res) {
		TrelloBoardService.getCardsForBoard (req.param ('board'))
		.then (aok (res), nok (res));
	}
};

