// External Requirements
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var jsforce = require('jsforce');
var url = require('url');

// Internal Requirements
// ToDo - Add routes!

// Create the app
var app = express();

// Jade Engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

// Set up the Oauth2 Info for jsforce
var oauth2 = new jsforce.OAuth2({
  clientId: '3MVG9VmVOCGHKYBSCAfWkFveQdwU4SOrIxxOMKuXxRGzaGOGgkkPBkazLRnoLZWf0NzbUEptPRzEbXlMydf2g',
  clientSecret: '2686887070428587222',
  redirectUri: 'http://localhost:8080/_auth'
});

// Create the connection using the Oauth2 Info
var conn = new jsforce.Connection({
  oauth2: oauth2
});

// Base URL redirects to authentication if not authorized
// Otherwise, redirect to search page
app.get('/', function(req, res) {
  if (!conn.accessToken) {
    res.redirect(oauth2.getAuthorizationUrl({
      scope: 'api id web'
    }));
  } else {
    res.redirect('/search');
  }
});

// Using jsforce, this redirects to Salesforce Oauth2 Page
// Gets authorization code and authenticates the user
app.get('/_auth', function(req, res) {
  var code = req.param('code');
  conn.authorize(code, function(err, userInfo) {
    if (err) {
      return console.error(err);
      res.render('index', {
        title: 'Could Not Connect!'
      });
    } else {
      var user;
      var queryString = ('SELECT Id, Name FROM User WHERE ' +
        'Id = \'' + userInfo.id + '\' LIMIT 1');
      conn.query(queryString)
        .on("record", function(record) {
          user = record;
        })
        .on("end", function(query) {
          app.locals.auth = conn.accessToken;
          app.locals.user = user.Name;
          app.locals.userId = user.Id;
          res.redirect('/search');
        })
        .on("error", function(err) {
          console.error(err);
        })
        .run({
          autoFetch: true,
          maxFetch: 4000
        });
    }
  });
});

app.get('/search', function(req, res) {
  res.render('search', {
    title: 'Search for a Varrow SFDC account',
  });
});

// Search results
app.post('/search/results', function(req, res) {
  var searchKey = req.param('searchKey');
  console.log(searchKey);
  var records = [];
  var queryString = ('SELECT Id, Name FROM Account WHERE ' +
    '(Name LIKE\'\%' + searchKey + '\%\' OR Name ' +
    'LIKE\'\%' + searchKey + '\' OR Name LIKE \'' +
    searchKey + '\%\') AND (NOT Name LIKE \'\%Leasing\%\')');
  conn.query(queryString)
    .on("record", function(record) {
      records.push(record);
    })
    .on("end", function(query) {
      console.log("total fetched : " + query.totalFetched);
      res.render('results', {
        title: query.totalFetched + ' Account Record(s) found for search: ' + searchKey,
        records: records
      });
    })
    .on("error", function(err) {
      console.error(err);
    })
    .run({
      autoFetch: true,
      maxFetch: 4000
    });
});

// Account Detail Page - Lots of Queries.
app.get('/account-detail/:id', function(req, res) {
  var id = req.param('id');
  var account;
  var queryString = ('SELECT Id, Name FROM Account WHERE ' +
    'Id = \'' + id + '\' LIMIT 1');
  conn.query(queryString)
    .on("record", function(record) {
      account = record;
    })
    .on("end", function(query) {
      console.log("Fetched: " + account.Name);
      res.render('account-detail', {
        title: 'Account Records',
        account: account
      });
    })
    .on("error", function(err) {
      console.error(err);
    })
    .run({
      autoFetch: true,
      maxFetch: 4000
    });
});

// Logout revokes the access token from the server and client
app.get('/logout', function(req, res) {
  conn.logout();
  conn.accessToken = '';
  res.render('index', {
    title: 'Disconnected from Salesforce!',
    auth: null
  });
});

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Start Listening!
app.listen(8080);
console.log('Express Server listening on port 8080');