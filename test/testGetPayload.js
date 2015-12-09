var mercurius = require('../index.js');
var request = require('supertest');
var assert = require('assert');
var nock = require('nock');
var should = require('chai').should();
var https = require('https');
var redis = require('redis');

var client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});

describe('mercurius', function() {
  var token;

  before(function(done) {
    mercurius.ready.then(function() {
      request(mercurius.app)
        .post('/register')
        .send({
          machineId: 'machineX',
          endpoint: 'https://android.googleapis.com/gcm/send/someSubscriptionID',
          key: '',
        })
        .expect(function(res) {
          token = res.body.token;
        })
        .end(done);
    });
  });

  it('replies with 404 on `getPayload` if there\'s no payload available', function(done) {
    request(mercurius.app)
      .get('/getPayload')
      .send({
        token: token,
      })
      .expect(404, done);
  });

  it('successfully sends a notification to a GCM endpoint', function(done) {
    nock('https://android.googleapis.com/')
    .post('/gcm/send')
    .reply(200);

    request(mercurius.app)
      .post('/notify')
      .send({
        token: token,
        payload: 'hello',
      })
      .expect(200, done);
  });

  it('replies with the payload encoded in JSON on `getPayload` if there\'s a payload available', function(done) {
    request(mercurius.app)
      .get('/getPayload')
      .send({
        token: token,
      })
      .expect(function(res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, '"hello"');
      })
      .end(done);
  });

  it('replies with the payload encoded in JSON on `getPayload` (doesn\'t remove the payload on `getPayload`)', function(done) {
    request(mercurius.app)
      .get('/getPayload')
      .send({
        token: token,
      })
      .expect(function(res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, '"hello"');
      })
      .end(done);
  });
});
