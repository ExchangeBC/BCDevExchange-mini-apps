
var github = require('octonode');
var yaml = require('js-yaml');

module.exports = {

	openIssues: function (req, res) {
		// sails.log.debug("getCommits request body", req.param('widget'));
		var widget = req.param('widget');
		GithubService.getCommits(widget, function (err, data, headers) {
			return res.json(data);
		});
	},
	issues: function (req, res) {
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

