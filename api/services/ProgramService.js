/*
 Copyright 2015 Province of British Columbia

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.
 */

'use strict'
// var async = require('async')
// var request = require('request')
var crypto = require('crypto')
var yaml = require('js-yaml')
// var config = require('config')
// var Q = require('q')
var _ = require('lodash')

// var https = require('https');
var github = require('octonode');

// var client = github.client ();
// var client = github.client ({
// 	id     : 'abcdefg',
// 	secret : 'gfedcba'
// });
var client = github.client ();

var configuration = {
	programListingPath : 'BCDevExchange/BCDevExchange-Programs',
	programListingYAML : 'Code/directory.yml',
	programListingBranch : 'master',
	programListingUrl : 'http://bcdevexchange-dev.pathfinder.gov.bc.ca/directory'
};

var byGITHUB = false;

// -------------------------------------------------------------------------
//
// go to the program listing repo and get the yaml file which lists them all
//
// -------------------------------------------------------------------------
var getAllPrograms = function () {
	console.log ('getting all programs');

	if (byGITHUB) {
		return new Promise (function (resolve, reject) {
			client
			.repo (configuration.programListingPath)
			.contents (configuration.programListingYAML, configuration.programListingBranch, function (err, body, headers) {
				var programYaml;
				try { programYaml = yaml.safeLoad (new Buffer (body.content, 'base64').toString('ascii')); }
				catch (e) { return reject (new Error ('Error while parsing yaml program file '+e.message)); }
				return resolve (programYaml);
			});
		});
	} else {
		return new Promise (function (resolve, reject) {
			var request = require ('request');
			request({
				url    : configuration.programListingUrl,
				method : 'GET',
				headers: {
					'host': 'localhost:4000',
		    		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
		    		'Content-Type': 'application/json'
		  		}
			}, function (err, res, body) {
				if (err) {
					err.fullpath = configuration.programListingUrl;
					reject (err);
				}
				else if (res.statusCode != 200) {
					reject (new Error (configuration.programListingUrl+': '+res.statusCode+' '+body));
				}
				else {
					console.log (configuration.programListingUrl+': '+res.statusCode+' ');
					console.log (body);
					resolve (JSON.parse(body));
				}
			});
		});
	}
};
exports.getAllPrograms = getAllPrograms;
// -------------------------------------------------------------------------
//
// go to the program listing repo and get the yaml file which lists them all
// parse the file out and return only those that are listed as visible.
// if a particular program name was passed in then only return that program
// and only if it is indicated as visible
//
// -------------------------------------------------------------------------
var getPrograms = function (title) {
	title = title || '';
	return getAllPrograms ()
	.then (function (programYaml) {
		return programYaml.filter (function (el) {
			return (el.visible === 'yes' && (!title || el.title === title));
		});
	});
};
exports.getPrograms = getPrograms;
// -------------------------------------------------------------------------
//
// get the issues for a single program
//
// -------------------------------------------------------------------------
var getIssuesForProgram = function (program, opts) {
	return new Promise (function (resolve, reject) {
		if (!program.githubUrl || program.githubUrl === 'undefined') return resolve ([]);
		var repo = program.githubUrl.replace (/^.*github\.com\//, '');
		var mrepo = client.repo (repo);
		//
		// Get all states, but only those with a label of help wanted
		//
		// mrepo.issues ({state:'all', per_page: 500, page:1}, function (err, issues) {
		mrepo.issues ({state:'all', labels:'help wanted', per_page: 500, page:1}, function (err, issues) {
			if (err) {
				console.log ('Error: ',program.title, ' ', repo, ' ', err.message);
				resolve ([]);
			}
			else if (issues) {
				console.log ('Number of issues:', issues.length);
				resolve (issues.map (function (i) {
					i.program = program.title;
					return i;
				}));
			}
			else resolve ([]);
		});
	});
};
exports.getIssuesForProgram = getIssuesForProgram;
// -------------------------------------------------------------------------
//
// get issues for a list of programs
//
// -------------------------------------------------------------------------
exports.getIssuesForPrograms = function (programs, opts) {
	//
	// sequential
	//
	// return programs.reduce (function (p, program) {
	// 	return p.then (function () {
	// 		return getIssuesForProgram (program, opts);
	// 	});
	// }, Promise.resolve ());
	//
	// parallel
	//
	return Promise.all (programs.map (function (program) {
		return getIssuesForProgram (program, opts);
	}));
};
var getIssuesForPrograms = function (opts) {
	return function (programs) {
		// 	console.log (programs);
		return exports.getIssuesForPrograms (programs, opts);
	};
};
// -------------------------------------------------------------------------
//
// get issues for one or all programs
//
// -------------------------------------------------------------------------
exports.getIssues = function (programName, opts) {
	return new Promise (function (resolve, reject) {
		getPrograms (programName)
		.then (getIssuesForPrograms (opts))
		.then (function (arrayofarrays) {
			// console.log (arrayofarrays);
			return arrayofarrays.reduce (function (prevArray, currArray) {
				prevArray = currArray.reduce (function (p, element) {
					p.push (element);
					return p;
				}, prevArray);
				return prevArray;
			});
		})
		.then (resolve, reject);
	});
};

// -------------------------------------------------------------------------
//
// categorize and decorate issues
//
// issues get seperated out into the following categories:
// States:
// 		open / closed / in progress / blocked
// 		open and closed are states, but the other two are psudo states
//		indicated by tags
//      NOTE: we ONLY look at issues with tags of 'help wanted' (this happens
//            prior to this routine being run, these are pre-filtered)
// Tags:
// 		skill:  these are indicated by colour 'eb6420', and to future proof
//				this we also look for 'skill:*'
//		earn:   these tags are indicated by the colour '0052cc' or 'earn:*'
//
//
// -------------------------------------------------------------------------
exports.categorizeIssues = function (issues) {
	console.log ('categorizing issues');
	var ret = {open:[],closed:[],inprogress:[],blocked:[]};
	_.each (issues, function (i) {
		console.log ('issue: ', i);
		//
		// get the lowercase label names and state
		//
		var labels = i.labels.map (function (l) {return l.name.toLowerCase();});
		var state = i.state.toLowerCase();
		var result;
		//
		// decide if closed, blocked, in progress, or open, all disjoint sets
		//
		if (state === 'closed') ret.closed.push (i);
		else if (!!~labels.indexOf ('blocked')) ret.blocked.push (i);
		else if (!!~labels.indexOf ('in progress')) ret.inprogress.push (i);
		else ret.open.push (i);
		//
		// now decorate skills and earn arrays
		//
		i.skill = [];
		i.earn  = [];
		_.each (i.labels, function (label) {
			if (label.color === 'eb6420') i.skill.push (label.name);
			else if (label.color === '0052cc') i.earn.push (label.name);
			else if ((result = label.name.match (/^skill:(.*)$/))) i.skill.push (result[1]);
			else if ((result = label.name.match (/^earn:(.*)$/))) i.earn.push (result[1]);
		});
	});
	return ret;
};

