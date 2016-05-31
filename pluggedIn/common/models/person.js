rypto = require("crypto")
  , _ = require('underscore')
var loopback = require('loopback');
var salt = "098%^&qwerty";
var io = require('socket.io');
var socketUsers = require('socket.io.users')
module.exports = function (Person) {
  Person.validatesUniquenessOf('email');

  // createUser will create a new Person in the database keeping the uniquness of email;
  // The code inputs Person details of type object where email, password and userName are required;
  // the function also stores password of Person as the md5 of input password and secret salt;

  Person.createUser = function(userDetails,cb){
    if(_.isObject(userDetails) && userDetails.email && userDetails.password && userDetails.userName){
      var emailId = userDetails.email;
      var encryptedPassword = crypto.createHash('md5').update(userDetails.password + '|' + salt).digest("hex").toLowerCase();
      userDetails.password = encryptedPassword;
      Person.findOrCreate({where:{email:userDetails.email}},userDetails,function(err,resp){
        if(err || !resp){
          err = err || "error while creating Person";
          return cb(err);
        }else{
          return cb(null,{status:"Person created",data:resp});
        }
      });
    }
  }

  Person.loginUser = function (loginDetails,cb) {
    var encryptedPassword = crypto.createHash('md5').update(loginDetails.password + '|' + salt).digest("hex").toLowerCase();
    Person.login({email: loginDetails.email,password: encryptedPassword}, function (err, users) {
      if (err) {
        return cb(err);
      }
      return cb(null, users);
    });
  };

  Person.beforeRemote('updateStatus', function(ctx, model, next) {
    console.log("calling before remote");
    console.log("@@@@@@@2222");
    console.log(accessToken);
    console.log("#############");
    console.log(model);
    console.log("$$$$$$$$$$$$$$");
    var accessToken = ctx.req.accessToken;
    if (accessToken) {
      ctx.req.body.subscriberId = accessToken.userId;
      return next();
    } else {
      var e = new Error('Invalid Access Token');
      e.status = e.statusCode = 401;
      log.error({
        err: e,
        accessToken: accessToken
      }, 'Invalid Access Token during addSubscription');
      return next(e);
    }
  });

  Person.updateStatus = function(emailId,statuInfo,cb){
    if(!email && !statuInfo){
      return cb("please enter valid data... email and status required");
    }
    Person.find({where:{emailId:email}},function(err,Person){
      if(err || !Person){
        err = err || "Person not found!";
        return cb(err);
      }else{
        Person.status = statuInfo;
        Person.save(function(err, savedInstance) {
          if (err) {
            return cb(err);
          }
          Person.emit('publish',savedInstance);
          return cb(null, savedInstance);
        });
      }
    });
  };

  Person.beforeRemote('addSubscription', function(ctx, model, next) {
    var accessToken = ctx.req.accessToken;
    if (accessToken) {
      ctx.req.body.subscriberId = accessToken.userId;
      return next();
    } else {
      var e = new Error('Invalid Access Token');
      e.status = e.statusCode = 401;
      log.error({
        err: e,
        accessToken: accessToken
      }, 'Invalid Access Token during addSubscription');
      return next(e);
    }
  });

  Person.addSubscription = function(id,cb){
    Person.findById(id,function(err,Person){
      if(err || !Person){
        err = err || "invalid Person";
      }else{
        Person.subscription.push(id);
        Person.save(function(err,savedInstance){
          if (err) {
            return cb(err);
          }
          return cb(null, savedInstance);
        })
      }
    })
  };

  Person.on('publish',function(personData){
    Person.find({where:{subscription:personData.id},fields:{id:true}},function(err,resp){
      if(err || !resp){
        err = err || "no one to publish updates";
        log.error(err);
      }else{
        var message = "status update of " + personData.userName + "=" + personData.status;
        var publishers = resp;
        
        console.log("!!!!!!!!!!!!!!!");
        console.log(publishers);
        console.log(message);
        io.on('connection', function(socket){
          
        });  
      }
    });
  });

  Person.remoteMethod(
    'createUser',
    {
      description: 'createUser',
      accepts: [
        {arg: 'details', type: 'Object', description: 'Person credentails', required: true,http: {source: 'body'}}
      ],
      returns: {arg: 'data', type: Person, root: true},
      http: {verb: 'POST', path: '/createUser/'}
    }
  );

  Person.remoteMethod(
    'loginUser',
    {
      description: 'loginUser',
      accepts: [
        {arg: 'loginDetails', type: 'Object', description: 'login credentials of Person', required: true,http: {source: 'body'}},
      ],
      returns: {arg: 'data', type: Person, root: true},
      http: {verb: 'POST', path: '/loginUser/'}
    }
  );


  Person.remoteMethod(
    'updateStatus',
    {
      description: 'updateStatus',
      accepts: [
        {arg: 'email', type: 'string', description: 'Person email', required: true,http: {source: 'path'}},
        {arg: 'status', type: 'string', description: 'status of Person', required: true,http: {source: 'body'}}
      ],
      returns: {arg: 'data', type: Person, root: true},
      http: {verb: 'PUT', path: '/updateStatus/:email'}
    }
  );

  Person.remoteMethod(
    'addSubscription',
    {
      description: 'addSubscription',
      accepts: [
        {arg: 'id', type: 'string', description: 'Person id', required: true,http: {source: 'body'}}
      ],
      returns: {arg: 'data', type: Person, root: true},
      http: {verb: 'POST', path: '/addSubscription/'}
    }
  );

};

