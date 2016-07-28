'use strict';

var ProgramService = require ('./api/services/ProgramService');
var _ = require ('lodash');

ProgramService.getIssues ('')
.then (ProgramService.categorizeIssues)
.then (function (issuesArray) {
	console.log ('===========================================');
	console.log ('Number of issues = ', issuesArray.data.length);
	console.log ('by State:');
	_.each (issuesArray.state, function (a, key) {
		console.log ('\t'+ (key + '                             ').substr(0, 25)+a.length);
	});
	console.log ('by Label:');
	_.each (issuesArray.label, function (a, key) {
		console.log ('\t'+ (key + '                             ').substr(0, 25)+a.length);
	});
	console.log ('===========================================');
});
