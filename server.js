'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var dns = require('dns');
var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

var Schema = mongoose.Schema;
var urlSchema = new Schema({
    original_url: String,
    short_url: Number
});

var Url = mongoose.model('Url', urlSchema);

Url.findOne({original_url : "https://www.freecodecamp.com"}, (err, data) => {
  if (!data) { 
    var fccForum = new Url({
      original_url: "https://www.freecodecamp.com",
      short_url: 1
    });

    fccForum.save((err, data) => {
      //console.log(err, data)
    });
  }    
})

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.post("/api/shorturl/:what", function (req, res) {
  
  if (req.params.what === "new") {
    var testReg = /https?:\/\/www\./ig;
    //var matchReg = /[^https?:\/\/www\.][a-z09.-]*/ig;
    var matchReg = /https?:\/\/www\./ig;
    
    var deleter = (s) => {
      if (s.endsWith("/")) {
        return s.substring(0, s.length - 1);
      }
      else {
        return s;
      }
    }
    var u = deleter(req.body.url)
  
    if (testReg.test(u)) { //if passed url test
      dns.lookup(u.split(matchReg)[1].split("/")[0], (err, address, family) => {
 
        if (!err) { //if passed dns test
          Url.findOne({original_url : u}, (err, data) => {
            if (!err && data) { //if the url is in the db
              res.json({"original_url": data.original_url, "short_url": data.short_url});              
            }
            else { //create the url in the db
              var timestamp = new Date().valueOf();
              var newUrl = new Url({
                original_url: u,
                short_url: timestamp
              });
              newUrl.save((err, data) => {
                res.json({"original_url": data.original_url, "short_url": data.short_url});
              });
            }
          })          
        }
        else { // if didn't pass dns test
          res.json({"error":"invalid URL"});  
        }
      });     
    }
    else { //if didn't pass url test
      res.json({"error":"invalid URL"});
    }
    
  }

});


app.get("/api/shorturl/:number", function(req, res){
  var shortUrl = Number(req.params.number);
  if (shortUrl) {
    Url.findOne({short_url : shortUrl}, (err, data) => {
      console.log(err, data)
      if (!err && data) {
        return res.redirect(data.original_url);
      }
      else {
        res.json({"error":"No short url found for given input"});
      }
    }) 
  }
  else {
    res.json({"error":"No short url found for given input"});
  }
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});