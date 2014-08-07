var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jsforce = require('jsforce');
var url = require('url');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.use(logger());
app.use(authChecker);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var oauth2 = new jsforce.OAuth2({
  clientId: '3MVG9VmVOCGHKYBSCAfWkFveQdwU4SOrIxxOMKuXxRGzaGOGgkkPBkazLRnoLZWf0NzbUEptPRzEbXlMydf2g',
  clientSecret: '2686887070428587222',
  redirectUri: 'http://localhost:8080/_auth'
});

var conn = new jsforce.Connection({
  oauth2: oauth2
});

app.get('/', function(req, res) {
  res.redirect(oauth2.getAuthorizationUrl({
    scope: 'api id web'
  }));
});

app.get('/_auth', function(req, res) {
  var code = req.param('code');
  conn.authorize(code, function(err, userInfo) {
    if (err) {
      return console.error(err);
      res.render('index', {
        title: 'Could Not Connect!'
      });
    } else {
      app.locals.auth = conn.accessToken;
      res.redirect(301, '/search');
      console.log(conn.accessToken);
      console.log(conn.refreshToken);
      console.log(conn.instanceUrl);
      console.log("User ID: " + userInfo.id);
      console.log("Org ID: " + userInfo.organizationId);
    }
  });
});

app.post('/search/accountsearch', function(req, res) {
  var searchKey = req.param('searchKey');
  var records = [];
  conn.query("SELECT Id, Name FROM Account WHERE " +
    "(Name LIKE\'\%" + searchKey + "\%\' OR Name " +
    "LIKE\'\%" + searchKey + "\' OR Name LIKE \'" +
    searchKey + "\%\') AND (NOT Name LIKE \'\%Leasing\%\')")
    .on("record", function(record) {
      records.push(record);
    })
    .on("end", function(query) {
      console.log("total in database : " + query.totalSize);
      console.log("total fetched : " + query.totalFetched);
      res.render('accounts', {
        title: query.totalFetched + ' Account Records Fetched',
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

app.get('/search', function(req, res) {
  res.render('index', {
    title: 'Successfully Connected!',
  });
});

app.get('/logout', function(req, res) {
  conn.logout();
  conn.accessToken = '';
  res.render('index', {
    title: 'Disconnected from Salesforce!',
    auth: null
  });
});

app.get('/accounts', function(req, res) {
  var records = [];
  conn.query("SELECT Id, Name FROM Account LIMIT 100")
    .on("record", function(record) {
      records.push(record);
    })
    .on("end", function(query) {
      console.log("total in database : " + query.totalSize);
      console.log("total fetched : " + query.totalFetched);
      res.render('accounts', {
        title: query.totalFetched + ' Account Records Fetched',
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

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.listen(8080);
console.log('Express Server listening on port 8080');
module.exports = app;


function authChecker(req, res, next) {
  if (!conn) {
    conn = new jsforce.Connection({
      oauth2: oauth2
    });
  }
  if (req.url != ('/') && url.format(req.url).indexOf('_auth') < 0 && !conn.accessToken) {
    console.log('Not authorized! Redirecting to /')
    res.redirect("/");
  } else {
    next();
  }
}