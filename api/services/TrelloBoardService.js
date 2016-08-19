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


var testme = false;
var authkey = '92af62ee176d0fb54fc3b4aa317226c4';

// -------------------------------------------------------------------------
//
// expecting a valid trello board ID, retrieve all the cards associated with
// the board
//
// -------------------------------------------------------------------------
exports.getCardsForBoard = function (board) {
	console.log ('Here with board:', board);
	// board = '574e1ea08cea9e13617400b6';
	var uri = 'https://api.trello.com/1/boards/'+board+'/cards?token='+authkey;
	return new Promise (function (resolve, reject) {
		//
		// if testing just return the cached data
		//
		if (testme) return resolve (require ('./testcarddata.json'));
		//
		// otherwise really do this properly
		//
		require ('request')({
			url    : uri,
			method : 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
				'Content-Type': 'application/json'
	  		}
		}, function (err, res, body) {
			if (err) {
				console.log ('Trello API error ', err);
				err.fullpath = uri;
				reject (err);
			}
			else if (res.statusCode != 200) {
				console.log ('Trello API non 200 response');
				reject (new Error ('Trello API non 200 response:'+res.statusCode+' '+body));
			}
			else {
				console.log ('Trello API successful call');
				resolve (JSON.parse(body));
			}
		});
	});
};
