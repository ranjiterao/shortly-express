var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'hackreactor'
}));

app.get('/', util.authCheck,
function(req, res) {
  res.render('index');
});

app.get('/create', util.authCheck,
function(req, res) {
  res.render('index');
});

app.get('/links', util.authCheck,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.get('/login',
function(req, res) {
  res.render('login');
});

app.get('/logout',
function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
});

app.post('/links', util.authCheck,
function(req, res) {
  var uri = req.body.url;

  if (uri.indexOf('www.') === 0) {
    uri = 'http://' + uri;
  }

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup',
  function(req, res) {
    res.render('signup');
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(found) {
    if (found) {
      console.log('Username already taken, please choose another');
      res.redirect('/signup');
    } else {
      util.hashPassword(password, function(hash) {
        Users.create({
          username: username,
          hash: hash
        }).then(function() {
          req.session.regenerate(function() {
            req.session.user = username;
            res.redirect('/');
          });
        });
      });  
    }
  });
});

app.post('/login',
  function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    new User({username: username})
    .fetch().then(function(found) {
      if(found) {
        util.comparePassword(password, found.attributes.hash, function(err, match) {
          if (err) {
            // ...some kind of database/connection error?
            console.log('Login failed!');
          } else if (match) {
            req.session.regenerate(function() {
              req.session.user = username;
              res.redirect('/');
            });
          } else {
            // wrong password
            console.log('Invalid combination of username and password!');
            res.redirect('/login');
          }
        });
      }
      else {
        // no such username
        console.log('Invalid combination of username and password!');
        res.redirect('/login');
      }
    });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
