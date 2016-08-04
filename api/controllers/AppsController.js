
var github = require('octonode');
var yaml = require('js-yaml');
var getCached = true;
var myCached = require ('../services/cached.json');

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
		.then (function (results) {
			console.log ('about to send results');
			res.json (results);
		});
	}
};

