var dateFormat = require('dateformat');
var fs = require('fs');
var crypto = require('crypto');
var fileReader = require('./fileReader');
var url = require('url');
var express = require('express');
var session = require('express-session')
var router = express.Router();
const sqlite3 = require("sqlite3").verbose();
router.use(express.static('public'));


const https = require('https');
const CONSTANTS = require('./constants');
var useragent = require('express-useragent');
router.use(useragent.express());

failedRegistration=null;
router.get('/dashboard', (req, res) => {
    log(req.session.userid);
    if(req.session.userid){
      fileReader.fileReader("/dashboard.html","text/html",req,res);
    } else {
      res.redirect("/login");
    }

});

router.get('/login', (req, res) => {
    fileReader.fileReader("/login.html","text/html",req,res);
});

router.get('/register', (req, res) => {
    req.session.failedReg=false;
    if(failedRegistration){
      req.session.failedReg=true;
    }
    fileReader.fileReader("/register.html","text/html",req,res);
    failedRegistration = false;
});


router.post("/getChallenge", (req,res) =>{
   var intent = req.body.intent;
     var username = req.session.username = req.body.username;
 if(intent=="authentication"){
   if(username == ""){
     res.redirect("/login");
     return;
   }
   var db = getDB();
   db.get(`select * from users where username = ? `,[username],
      (err, row) => {
      if (err) {
        log("ERROR: "+ err.message);
      }
      if (row) {
  req.session.possibleuserid = row.id;
   process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
     const data =JSON.stringify({
       svcinfo: CONSTANTS.SVCINFO,
       payload: {
    username: username,
    options: {}
       }
     });
     const options = {
       hostname: CONSTANTS.SKFS_HOSTNAME,
       port: CONSTANTS.SKFS_PORT,
       path: CONSTANTS.SKFS_PREAUTHENTICATE_PATH,
       method: 'POST',
       headers: {
  'Content-Type': 'application/json'
       }
     };
     const fido2Req = https.request(options, fido2Res => {
       log(`statusCode: ${fido2Res.statusCode}`);

       fido2Res.on('data', d => {
  log("challengeBuffer=");
  log(d);
  res.json({Response:d.toString()});
       })
     });
     fido2Req.on('error', error => {
       log(error);
       res.json({Response:"skfs-error"});
     });
     fido2Req.write(data);
     fido2Req.end();
       } else {
  res.json({Response:"sqlite-error"});
       }
     });
 } else if(intent=="registration"){
   var firstname = req.session.firstname = req.body.firstname;
   var lastname = req.session.lastname = req.body.lastname;
   var displayname = req.session.displayname= req.body.displayname;
   if(username == "" | displayname=="" | firstname == "" | lastname == ""){
     res.redirect("/register");
     return;
   }
   var db = getDB();
   db.get(`select * from users where username = ? `,[username],
      (err, row) => {
      if (err) {
        log("ERROR: "+ err.message);
      }
      if (!row) {

  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
 const data = JSON.stringify({
    svcinfo: CONSTANTS.SVCINFO,
    payload: {
       username: username,
       displayname: displayname,
       options: {"attestation":"direct"},
       extensions: "{}"
     }
 });
 const options = {
   hostname: CONSTANTS.SKFS_HOSTNAME,
   port: CONSTANTS.SKFS_PORT,
   path: CONSTANTS.SKFS_PREREGISTRATION_PATH,
   method: 'POST',
   headers: {
 'Content-Type': 'application/json'
   }
 };
 const fido2Req = https.request(options, fido2Res => {
   log(`statusCode: ${fido2Res.statusCode}`);

   fido2Res.on('data', d => {
 log("challengeBuffer=");
 log(d);
 res.json({Response:d.toString()});
   })
 });
 fido2Req.on('error', error => {
   log(error);
   res.json({Response:"skfs-error"});
 });
 fido2Req.write(data);
 fido2Req.end();
   } else {
 failedRegistration=true;
 res.json({Response:"sqlite-error"});
   }
 });
 }
 });
router.post("/submitChallengeResponse", (req,res) =>{
     var intent = req.body.intent;
       var username = req.session.username;
       var credResponse = req.body;
       var reqOrigin = req.get('host');

   let data = "";
   let path = "";
 if(intent=="authentication"){
   var metadataJSON = {
   version: CONSTANTS.METADATA_VERSION,
   last_used_location: CONSTANTS.METADATA_LOCATION,
   username: username,
   origin: "https://"+reqOrigin,
  clientUserAgent: req.useragent.source
   };
   var responseJSON =   {
   id: credResponse.id,
   rawId: credResponse.rawId,
   response: {
       authenticatorData: credResponse.authenticatorData,
       signature: credResponse.signature,
       userHandle: credResponse.userHandle,
       clientDataJSON: credResponse.clientDataJSON
   },
   type: "public-key"};
 data = JSON.stringify({
   svcinfo: CONSTANTS.SVCINFO,
   payload: {
     strongkeyMetadata: metadataJSON,
     publicKeyCredential: responseJSON,
   }
 });
  path = CONSTANTS.SKFS_AUTHENTICATE_PATH;
 } else if(intent=="registration"){
   var firstname = req.session.firstname;
   var lastname = req.session.lastname;
   var db = getDB();
   var metadataJSON = {
   version: CONSTANTS.METADATA_VERSION,
   create_location: CONSTANTS.METADATA_LOCATION,
   username: username,
   origin: "https://"+reqOrigin
   };

 var responseJSON =   {
     id: credResponse.id,
     rawId: credResponse.rawId,
     response: {
  attestationObject: credResponse.attestationObject,
  clientDataJSON: credResponse.clientDataJSON
     },
     type: "public-key"};

 data = JSON.stringify({
   svcinfo: CONSTANTS.SVCINFO,
     payload: {
      strongkeyMetadata: metadataJSON,
      publicKeyCredential: responseJSON,
    }
  });
  path = CONSTANTS.SKFS_REGISTRATION_PATH;
 }
 const options = {
   hostname: CONSTANTS.SKFS_HOSTNAME,
   port: CONSTANTS.SKFS_PORT,
   path: path,
   method: 'POST',
   headers: {
 'Content-Type': 'application/json'
   }
 };

 const fido2Req = https.request(options, fido2Res => {
   log(`statusCode: ${fido2Res.statusCode}`);

   fido2Res.on('data', d => {
 if(d.toString().toLowerCase().includes("error")){
   res.json({Response:d.toString()});
   return;
 }
     if(intent == "registration"){
       db.run('insert into users(username,first_name,last_name) values(?,?,?)',[username,firstname,lastname], function(err) {
      if (err) {log("ERROR: "+ err.message);}
          log("user added: \nfirst name: "+firstname+"\nlast name: "+lastname+"\nusername: "+username);
          req.session.justReg=true;
          log(d);
          res.json({Response:d.toString()});
        });
       } else if(intent == "authentication"){
  req.session.userid = req.session.possibleuserid;
  log(d);
  res.json({Response:d.toString()});
       }
   })

 });

 fido2Req.on('error', error => {
   log(error);
   res.json({Response:"error"});
 });
 process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
 fido2Req.write(data);
 fido2Req.end();
   });


//add a quote
router.post("/addQuote", (req,res) =>{
  var id = req.session.userid;
  var name = req.body.name;
  var now = new Date();
  var date = dateFormat(now, "ddd mmm dd yyyy HH:MM:ss Z");
  var filepath = req.body.filepath;
  var db = getDB();
  //checking if quote is already in database
  db.get(`select * from quotes where name = ? or filepath = ? `,[name,filepath],
     (err, row) => {
     if (err) {
       log("ERROR: "+ err.message);
     }
     if(!row){
       //adding quote to database
       db.run('insert into quotes(uploader,name,date,filepath) values(?,?,?,?)',[id, name, date, filepath], function(err) {
           if (err) {log("ERROR: "+ err.message);}
           log("quote added: name: "+name+"\nuploader: "+id+"\nfilepath: "+filepath);
           res.redirect("/dashboard");
       });
     } else {
       res.redirect("/dashboard");
     }
    });
  });

//logging out current user
router.get("/logout", (req,res)=>{
  log(req.session.userid+" signed out");
  req.session.userid=null;
  res.redirect("/login");
});

//getting username from database
router.post("/getUsername", (req,res) =>{
  var db = getDB();
  var id = req.session.userid;

  db.get(`select username from users where id = ? `,[id],
     (err, row) => {
     if (err) {
       log("ERROR: "+ err.message);
     }
     res.json({userData:row});
  });
});

//get quotes based on currently signed in uploader
router.post("/getQuotes", (req,res) =>{
  var db = getDB();
  var id = req.session.userid;

  db.all(`select * from quotes where uploader = ? `,[id],
     (err, row) => {
     if (err) {
       log("ERROR: "+ err.message);
     }
     res.json({quotes:row});
  });
});
//get all quotes from all users
router.post("/getAllQuotes", (req,res) =>{
  var db = getDB();
  db.all(`select * from quotes `,
     (err, row) => {
     if (err) {
       log("ERROR: "+ err.message);
     }
     res.json({quotes:row});
  });
});
//delete a quote
router.post("/deleteQuote", (req,res) =>{
  var db = getDB();
  var id = req.session.userid;
  if(id === null){
    res.redirect("/login");
  }
  var quoteId = req.body.id;
  db.run(`delete from quotes where Qid = ?`, quoteId, function(err) {
      if (err) {
        return console.error(err.message);
      }
    log(req.session.userid+" deleted quote " +quoteId);
    res.redirect("/dashboard");
  });


});
//delete user
router.get("/deleteUser", (req,res) =>{
  var db = getDB();
  var id = req.session.userid;
  var username = req.session.username;
      req.session.userid=null;
      log("logout user " +id +" "+username);

       db.run(`delete from users where id = ?`, id, function(err) {
           if (err) {
      return console.error(err.message);
           }
           process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      const data = JSON.stringify({
        svcinfo: CONSTANTS.SVCINFO,
        payload: {
     username: username
        }
      });
      const options = {
        hostname: CONSTANTS.SKFS_HOSTNAME,
        port: CONSTANTS.SKFS_PORT,
        path: CONSTANTS.SKFS_GET_KEYS_INFO_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const fido2Req = https.request(options, fido2Res => {
        log(`statusCode: ${fido2Res.statusCode}`);

        fido2Res.on('data', d => {
          log("keyInfo=");
          log(d);
          const dataDel = JSON.stringify({
     svcinfo: CONSTANTS.SVCINFO,
     payload: {
         "keyid": JSON.parse(d).Response.keys[0].randomid
     }
    });
          const optionsDel = {
     hostname: CONSTANTS.SKFS_HOSTNAME,
     port: CONSTANTS.SKFS_PORT,
     path: CONSTANTS.SKFS_DEREGISTER_PATH,
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     }
          };
          const fido2ReqDel = https.request(optionsDel, fido2ResDel => {
     log(`statusCode: ${fido2ResDel.statusCode}`);

     fido2ResDel.on('data', dDel => {
       log(dDel);
       log("deleted user " +id);
       req.session.justUserDeleted = true;
       res.redirect("/login");
     })
          });
          fido2ReqDel.on('error', errorDel => {
     log(errorDel);
     res.json({Response:"skfs-error"});
          });
          fido2ReqDel.write(dataDel);
          fido2ReqDel.end();
        })
      });
      fido2Req.on('error', error => {
        log(error);
        res.json({Response:"skfs-error"});
      });
      fido2Req.write(data);
      fido2Req.end();
       });

});

router.post("/getFailedReg", (req,res) =>{
  res.json({failed:req.session.failedReg});
});
router.post("/justReg", (req,res) =>{
  if (req.session.justReg){
    req.session.justReg = false;
    res.json({justReg:true});
  } else {
    res.json({justReg:false});
  }
});
//returns if the user was just deleted
router.post("/justUserDeleted", (req,res) =>{
  if (req.session.justUserDeleted){
    req.session.justUserDeleted = false;
    res.json({justUserDeleted:true});
  } else {
    res.json({justUserDeleted:false});
  }
});


//internal src file paths

router.get("/styles/*", (req,res) =>{
  fileReader.fileReader(req.url,"text/css",req,res);
});
router.get("/js/*", (req,res) =>{
  fileReader.fileReader(req.url,"text/javascript",req,res);
});
router.get("/fonts/*", (req,res) =>{
  fileReader.fileReader(req.url,"font/opentype",req,res);
});
router.get("/background.jpg", (req,res) =>{
  fileReader.fileReader("/img/background.jpg","image/jpeg",req,res);
});
router.get("/logo.png", (req,res) =>{
  fileReader.fileReader("/img/logo.png","image/png",req,res);
});


//catch all route
//redirects all unahandled get requests to dashboard or login depending on if
//the user is logged in
router.get('/*', (req, res) => {
  if(req.session.userid){
    res.redirect("/dashboard");
  } else {
    res.redirect("/login");
  }
});


//database access
var getDB = function(){
  let db = new sqlite3.Database('./db/aftdb.db',sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      return log("getDB ERROR: "+ err.message);
    }
  });
  return db;
}

//close database access
var closeDB = function(db){
  db.close((err) => {
    if (err) {
      return log("closeDB ERROR: "+ err.message);
    }
  });
}

//logging
var log = function(message){
  fs.appendFile('log', Date()+message+"\n", function (err) {if (err) throw err;});
}

module.exports = router;
