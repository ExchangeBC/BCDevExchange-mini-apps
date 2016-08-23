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
var request = require ('request');
var _ = require ('lodash');

var testme = false;
var authkey = '92af62ee176d0fb54fc3b4aa317226c4';

var ourboards = [
    {
        "name": "A - Roadmap",
        "id": "574876ddff45671f28a5cca6",
        "shortUrl": "https://trello.com/b/j3Ol7kEr"
    },
    {
        "name": "Code 4 Gov",
        "id": "57487bc6392545b588edd820",
        "shortUrl": "https://trello.com/b/39R3K5dd"
    },
    {
        "name": "Code With Us (Paid)",
        "id": "57487ba0800f04d9a7f145c2",
        "shortUrl": "https://trello.com/b/HiFIKN0j"
    },
    {
        "name": "Code With Us (Volunteer)",
        "id": "57487bf96d18dddf0cb88397",
        "shortUrl": "https://trello.com/b/4F46oDkv"
    },
    {
        "name": "DevEx App",
        "id": "574e1ea08cea9e13617400b6",
        "shortUrl": "https://trello.com/b/b0goM5r8"
    },
    {
        "name": "Ideas Board",
        "id": "57868c989b5166d5f1323122",
        "shortUrl": "https://trello.com/b/XlRMRIbt"
    },
    {
        "name": "Kick - Start",
        "id": "574877755e36129a30a9df96",
        "shortUrl": "https://trello.com/b/z5aY0htv"
    },
    {
        "name": "PaaS Build 2016",
        "id": "5733e1b56436aeb2a2a256bb",
        "shortUrl": "https://trello.com/b/rz9945E5"
    },
    {
        "name": "Sprint with us",
        "id": "57487c078f1348fd0c339d99",
        "shortUrl": "https://trello.com/b/5GaODBBc"
    },
    {
        "name": "Welcome Board",
        "id": "577d43f86de70beb6e4fe6a8",
        "shortUrl": "https://trello.com/b/XX89Wfsf"
    }
];


// -------------------------------------------------------------------------
//
// generic request handler
//
// -------------------------------------------------------------------------
var issueRequest = function (uri) {
	return new Promise (function (resolve, reject) {
		request({
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
				resolve (JSON.parse(body));
			}
		});
	});
};

// -------------------------------------------------------------------------
//
// wrapper for getting trello lists for a board
//
// -------------------------------------------------------------------------
var getBoard = function (board) {
	if (testme) return Promise.resolve (require ('./cachedBoard.json'));
	else return issueRequest ('https://api.trello.com/1/boards/'+board+'?token='+authkey);
};
// -------------------------------------------------------------------------
//
// wrapper for getting trello lists for a board
//
// -------------------------------------------------------------------------
var getLists = function (board) {
	if (testme) return Promise.resolve (require ('./cachedLists.json'));
	else return issueRequest ('https://api.trello.com/1/boards/'+board+'/lists?token='+authkey);
};
// -------------------------------------------------------------------------
//
// get cards
//
// -------------------------------------------------------------------------
var getCards = function (board) {
	if (testme) return Promise.resolve (require ('./cachedCards.json'));
	else return issueRequest ('https://api.trello.com/1/boards/'+board+'/cards?token='+authkey);
};

// -------------------------------------------------------------------------
//
// expecting a valid trello board ID, retrieve all the cards associated with
// the board
//
// -------------------------------------------------------------------------
exports.getCardsForBoard = function (board) {
	return getCards (board);
};
// -------------------------------------------------------------------------
//
// expecting a valid trello board ID, retrieve all the cards associated with
// the board
//
// -------------------------------------------------------------------------
exports.getListsForBoard = function (board) {
	return getLists (board);
};

// -------------------------------------------------------------------------
//
// get counts of cards in lists on a board
//
// -------------------------------------------------------------------------
exports.getListDistribution = function (board) {
	return new Promise (function (resolve, reject) {
		var lists;
		var cards;
		Promise.all ([ getLists (board), getCards (board), getBoard (board) ])
		.then (function (data) {
			var listIndex = {};
			//
			// make an index of cards by id
			// decorate each list with the board name and url
			//
			_.each (data[0], function (list) {
				listIndex[list.id] = list;
				list.cards = [];
				list.boardName = data[2].name;
				list.boardUrl = data[2].url;
			});
			//
			// for each card, find its list in the index and
			// add it to the list cards array
			// also decorate each card with the list name board name
			// and board url
			//
			_.each (data[1], function (card) {
				card.boardName = data[2].name;
				card.boardUrl = data[2].url;
				card.listName = listIndex[card.idList].name;
				listIndex[card.idList].cards.push (card);
			});
			return (data[0])
		})
		.then (resolve, reject);
	});
};

