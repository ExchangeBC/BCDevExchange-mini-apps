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
var client = github.client ({
	username     : 'ccoldwell',
	password : '1qazse4'
});
// var client = github.client ();

var configuration = {
	programListingPath : 'BCDevExchange/BCDevExchange-Programs',
	programListingYAML : 'Code/directory.yml',
	programListingBranch : 'master',
	programListingUrl : 'http://bcdevexchange-dev.pathfinder.gov.bc.ca/directory'
};

var byGITHUB = true;

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
	// return new Promise (function (resolve, reject) {
	// 	client
	// 	.repo (configuration.programListingPath)
	// 	.contents (configuration.programListingYAML, configuration.programListingBranch, function (err, body, headers) {
	// 		var programYaml;
	// 		try { programYaml = yaml.safeLoad (new Buffer (body.content, 'base64').toString('ascii')); }
	// 		catch (e) { return reject (new Error ('Error while parsing yaml program file '+e.message)); }
	// 		return resolve (programYaml.filter (function (el) {
	// 			return (el.visible === 'yes' && (!title || el.title === title));
	// 		}));
	// 	});
	// });
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
		// console.log ('program githubUrl = ', repo);
		var mrepo = client.repo (repo);
		// console.log (mrepo);
		mrepo.issues ({per_page: 500, page:1}, function (err, issues) {
			// console.log ("=============================================");
			// console.log ('program title = ', program.title);
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
		// mrepo.issues ({
		// 	filter: opts.filter,
		// 	state: opts.state,
		// 	sort: 'created'
		// },
		// function (err, a, b) {
		// 	console.log (err, a, b);
		// });
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
// categorize issues
//
// -------------------------------------------------------------------------
exports.categorizeIssues = function (issues) {
	var ret = {state:{},label:{},data:[]};
	_.each (issues, function (i) {

		ret.data.push (i);

		var state = i.state.toLowerCase();
		// console.log (state);
		var labels = i.labels.map (function (l) {return l.name.toLowerCase();});
		// console.log (labels);

		if (!ret.state[state]) ret.state[state] = [];
		ret.state[state].push (i);

		_.each (labels, function (label) {
			if (!ret.label[label]) ret.label[label] = [];
			ret.label[label].push (i);
		});

	});
	return ret;
};

// exports.getProgramsFromArray = function (programList, success, error) {
//   async.concat(programList, exports.getPrograms, function (err, results) {
// 	if (err)
// 	  error(err)
// 	else {

// 	  // filter out invisible
// 	  var i = 0
// 	  while (i < results.length) {
// 		var program = results[i]
// 		if (program.visible !== "yes" &&
// 		  program.visible !== "y" &&
// 		  program.visible !== "true") {

// 		  // remove from result
// 		  results.splice(i, 1)

// 		  // decrement the counter
// 		  i--
// 		}
// 		i++
// 	  }
// 	  success(results)
// 	}
//   })
// }

// exports.getProgramsO = function (program, callback) {

//   if (program.type === "github-file") {
// 	exports.getGitHubFileProgram(program, callback)
//   } else {
// 	console.error("Configuration error, unknown program type: " + program.type)
//   }

// }

// exports.getGitHubFileProgram = function (ghConfig, callback) {
//   var options = {
// 	url: 'https://api.github.com/' + ghConfig.url + "?client_id=" + config.github.clientID + "&client_secret=" + config.github.clientSecret,
// 	headers: {
// 	  'User-Agent': config.github.clientApplicationName
// 	}
//   }
//   request(options, function (error, response, body) {
// 	if (!error &&
// 	  typeof response !== 'undefined' &&
// 	  response.statusCode === 200) {

// 	  // parse out the yaml from content block
// 	  var json = JSON.parse(body)
// 	  var decodedContent = new Buffer(json.content, 'base64').toString('ascii')
// 	  var programYaml

// 	  try {
// 		programYaml = yaml.safeLoad(decodedContent)

// 	  } catch (requestError) {
// 		var message = 'Error while parsing yaml program file from: ' + options.url + '. message: ' + requestError.message
// 		console.error(message)
// 		return callback(message)
// 	  }
// 	  // remove extraneous info from result
// 	  async.concat(programYaml, parseGitHubFileResults, function (err, results) {
// 		return callback(err, results)
// 	  })
// 	} else {
// 	  console.error('Error while fetching GitHub content: %s. response: %s. body: %s', error, response, body)
// 	  return callback(error)
// 	}
//   })
// }

// function parseGitHubFileResults(result, callback) {
//   var transformed = {
// 	"title": result.title,
// 	"description": result.description,
// 	"owner": result.owner,
// 	"logo": result.logo,
// 	"tags": [],
// 	"url": result.url,
// 	"id": result.id,
// 	"visible": result.visible
//   }

//   if (result.tags) {
// 	var i = 0
// 	while (i < result.tags.length) {
// 	  transformed.tags[i] = {
// 		"display_name": result.tags[i]
// 	  }
// 	  transformed.tags[i].id = crypto.createHash('md5').update(result.tags[i]).digest("hex")
// 	  i++
// 	}
//   }
//   return callback(null, transformed)

// }

// exports.getGitHubList = function (ghRepo, item, cb) {
//   var url = 'https://api.github.com/repos/' + ghRepo + item + "&client_id=" + config.github.clientID + "&client_secret=" + config.github.clientSecret
//   var statsResArr = []
//   var retryCnt = 0
//   var queryGitHub = function (url, cb) {
// 	var options = {
// 	  url: url,
// 	  headers: {
// 		'User-Agent': config.github.clientApplicationName
// 	  }
// 	}
// 	request(options, cb)
//   }
//   var parseRes = function (error, response, body) {
// 	if (!error &&
// 	  typeof response !== 'undefined') {
// 	  switch (response.statusCode) {
// 		case 200:
// 		  retryCnt = 0
// 		  Array.prototype.push.apply(statsResArr, JSON.parse(body))
// 		  var matchUrl
// 		  if (response.headers.link && (matchUrl = response.headers.link.match(/<(https:\/\/api.*)>;\s+rel="next"/))) {
// 			url = matchUrl[1]
// 			queryGitHub(url, parseRes)
// 		  }
// 		  else {
// 			return cb(null, statsResArr)
// 		  }
// 		  break
// 		case 202:
// 		  if(retryCnt++ < 5){
// 			// retry in 100ms
// 			console.info('received response code 202. Retry.')
// 			setTimeout(function () {
// 			  queryGitHub(url, parseRes)
// 			}, 100)
// 			break
// 		  }
// 		default:
// 		  console.error('Error fetching GitHub content for %s: %s. response: %s. body: %s', ghRepo + item, error, JSON.stringify(response), body)
// 		  return cb(error || response.statusCode)
// 	  }
// 	} else {
// 	  console.error('Error fetching GitHub content for %s: %s. response: %s. body: %s', ghRepo + item, error, JSON.stringify(response), body)
// 	  return cb(error || response.statusCode)
// 	}
//   }
//   queryGitHub(url, parseRes)
// }


// exports.getProgramDetails = function (progData, callback) {

//   var deferred = Q.defer()
//   // Call github for stats
//   var githubStatsUrl = progData.githubStatsUrl || progData.githubUrl
//   if (!githubStatsUrl) {
// 	setTimeout(function () {
// 	  deferred.resolve({})
// 	}, 0)
// 	return deferred.promise.nodeify(callback)
//   }

//   var ghRepo = githubStatsUrl.substr(githubStatsUrl.indexOf('github.com') + 11)
//   async.parallel([function (cb) {
// 	exports.getGitHubList(ghRepo, '/contributors?per_page=100', cb)
//   },
// 	function (cb) {
// 	  exports.getGitHubList(ghRepo, '/issues?state=all&per_page=100', cb)
// 	}], function (err, resArr) {
// 	var res = {}
// 	try {
// 	  res.contributors = resArr[0].length
// 	} catch (ex) {
// 	}
// 	try {
// 	  var issuesPrArr = resArr[1]
// 	  res.prs = _.reduce(issuesPrArr, function (result, item) {
// 		return result + ((item.pull_request && item.state === 'closed') ? 1 : 0)
// 	  }, 0)

// 	  res.issues = _.reduce(issuesPrArr, function (result, item) {
// 		return result + ((!item.pull_request && item.state === 'open') ? 1 : 0)
// 	  }, 0)

// 	  // find help wanted issues
// 	  res.helpWantedIssues = issuesPrArr.filter(function (e, i, a) {
// 		if (e.pull_request || e.state !== 'open') {
// 		  return false
// 		}
// 		var helpIdx = _.findIndex(e.labels, function (e, i, a) {
// 		  var name = e.name
// 		  return name === 'help wanted'
// 		})
// 		return helpIdx >= 0
// 	  })

// 	  // find closed help wanted issues
// 	  res.closedHelpWantedIssues = issuesPrArr.filter(function (e, i, a) {
// 		if (e.pull_request || e.state !== 'closed') {
// 		  return false
// 		}
// 		var helpIdx = _.findIndex(e.labels, function (e, i, a) {
// 		  var name = e.name
// 		  return name === 'help wanted'
// 		})
// 		return helpIdx >= 0
// 	  })

// 	} catch (ex) {
// 	}
// 	deferred.resolve(res)
//   })
//   return deferred.promise.nodeify(callback)
// }
