var getCached = false;
var myCached = require('../services/cached.json');

var aok = function (res) {
    return function (o) {
        sails.log.debug ('about to send results');
        res.json (o);
    }
};

var nok = function (res) {
    return function (e) {
        sails.log.debug ('about to send results');
        res.json (e);
    }
};

module.exports = {

    openIssues: function (req, res) {
        sails.log.debug("getCommits request body", req.param('widget'));
        var widget = req.param('widget');
        GithubService.getCommits(widget, function (err, data, headers) {
            return res.json(data);
        });
    },
    issues: function (req, res) {
        if (getCached) return res.json (myCached);
        var program = req.params.program || '';
        sails.log.debug ('gathering issues for program: ' + program);
        ProgramService.getIssues (program)
            .then (ProgramService.categorizeIssues)
            .then (aok(res), nok(res));
    },
    cards: function (req, res) {
        TrelloBoardService.getCardsForBoard (req.param ('board'))
            .then (aok(res), nok(res));
    },
    lists: function (req, res) {
        TrelloBoardService.getListsForBoard (req.param ('board'))
            .then (aok(res), nok(res));
    },
    listdist: function (req, res) {
        TrelloBoardService.getListDistribution (req.param ('board'))
            .then (aok(res), nok(res));
    }
};

