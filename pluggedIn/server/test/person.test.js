var request = require('supertest');
var app = require('../server');
var assert = require('chai').assert;
var crypto = require("crypto");
var nock = require('nock');
function json(verb, url, params, headers) {
    if (params) {
        var queryString = Object.keys(params).reduce(function (a, k) {
            a.push(k + '=' + params[k]);
            return a;
        }, []).join('&');

        url = url + '?' + queryString;
    }

//  console.log('calling [' + verb + '] on [' + url + ']');

    var result = request(app)[verb](url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/);

    if (headers) {
        Object.keys(headers).forEach(function (a, k) {
            result.set(a, headers[a]);
        });
    }

    return result
}

describe('Person', function () {
    var cleanNocks = function (done) {
        nock.cleanAll();
        done();
    };
    beforeEach(cleanNocks);
    afterEach(cleanNocks);

    var Person = app.models.Person;

    this.timeout(30000);

    describe('Person before ', function () {
        var email = 'test-person@exaple.com'

        var authToken, personId;

        before(function (done) {
            Person.destroyAll({email: {inq: [email]}}, function (err) {
                if (err) return done(err);
                done();
            });
        });
        describe('Person POST create user',function(done){
            it('should create a user',function (done) {
                json('post','/api/createUser',{},{})
                    .send({
                        "email":email,
                        "password":"0987654321",
                        "status":"shopping at SNG",
                        "userName":"sam"
                    })
                    .expect(200,function(err,resp){
                        if(err) return done(err);
                        assert(resp.body.email,'should be there');
                        done();
                    });
            });
            it('should login a user',function (done) {
                json('post','/api/loginUser',{},{})
                    .send({
                        "email":email,
                        "password":"0987654321"
                    })
                    .expect(200,function(err,resp){
                        if(err) return done(err);
                        authToken = resp.body.id;
                        personId = resp.body.userId;
                        assert(resp.body.email,'should be there');
                        done();
                    });
            });
            it('should update status',function (done) {
                json('post','/api/updateStatus/'+email,{"Authorization":authToken})
                    .send({
                        "status":"landed in cp"
                    })
                    .expect(200,function(err,resp){
                        if(err) return done(err);
                        done();
                    });
            });
        })
    });
});
