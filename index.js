var express = require('express');
var ejsLayouts = require('express-ejs-layouts');
var session = require('express-session');
var bodyParser = require('body-parser');
var request = require('request');
var flash = require('connect-flash');
var db = require("./models");
var moment = require('moment');

    
var app = express();

app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.use(bodyParser.urlencoded({extended: false}));

app.use("/", express.static(__dirname + '/views'));
app.use("/static", express.static(__dirname + '/static'));

app.use(session({
  secret: 'dsalkfjasdflkjgdfblknbadiadsnkl',
  resave: false,
  saveUninitialized: true
}));

app.use(flash());

app.use(function(req, res, next){
  if(req.session.userId) {
    db.user.findById(req.session.userId).then(function(user) {
      req.currentUser = user;
      res.locals.currentUser = user;
      next();
    });
  } else {
    req.currentUser = false;
    res.locals.currentUser = false;
    next();
  }
});





app.get('/', function(req, res){
  res.render('auth/login', {alerts: req.flash()});
});

app.get('/settings', function(req, res){
  if(req.currentUser) {
  res.render('settings');
} else {
    req.flash('danger', 'You must be logged in, buddy...');
    res.redirect('/');
  }
});


app.post('/', function(req, res) {
  console.log("entering route");
  var email = req.body.email;
  var password = req.body.password;
  db.user.authenticate(email, password, function(err, user) {
    if(err){
      res.send(err);
    } else if (user){
      req.session.userId = user.id;
      res.redirect('/today');
    } else {
      res.send('email and/or password invalid');
    }
  });
});



app.get('/today', function(req, res) {
  if(req.currentUser) {
    var MyDate = new Date();
    var now;

    MyDate.setDate(MyDate.getDate());

    now = ('0' + (MyDate.getMonth()+1)).slice(-2) + '/'
             + ('0' + MyDate.getDate()).slice(-2) + '/'
             + MyDate.getFullYear();
    var nowText = moment().format('MMMM Do, YYYY');
// I want to pass data from event and itinItem to 'today.ejs' connected by groupId
    db.event.findOne({where: {date: now, groupId: req.currentUser.groupId},include:[db.itinItem],order: '"startTime" ASC'}).then(function(event){
    res.render('showday', {date: nowText, event: event});
  });
  } else {
    req.flash('danger', 'You must be logged in, buddy...');
    res.redirect('/');
  }
});


app.get('/new-event', function(req, res){
  res.render('new-event');
});


app.get('/new-event/result', function(req, res){
  var query = req.query.q;
  var fullQuery = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + query + '&key='+process.env.KEY;
  console.log(fullQuery);
  console.log("running get request route");
  request(fullQuery, function(err, response, body) {
      var data = JSON.parse(body);
    
    if (!err && response.statusCode == 200) {   
      res.send(data);
    } else {
      res.render('error')
    } 
  });
});

app.get('/new-event/result/:id', function(req, res){
  var id = req.params.id;
  console.log(id);
})

app.post('/new-event/result/', function(req, res){
  console.log(req.body);
  
  // db.event.create({place_id: id}).then(function(data){

  // })
});


// app.post('/new-event/result/', function(req, res){
 
// });



app.get('/logout', function(req, res){
  req.session.userId = false;
  res.redirect('/');
});


app.use('/auth', require('./controllers/auth'));

app.listen(3000);