var sanitize = require('./index.js');
var assert = require('assert');
var express = require('express');
var superagent = require('superagent');

describe('sanitize', function() {
  it('should remove fields that start with $ from objects', function() {
    // { $gt: 5 } -> {}
    assert.equal(Object.keys(sanitize({ $gt: 5 })).length, 0);
    // { $gt: 5, a: 1 } -> { a: 1 }
    assert.deepEqual(sanitize({ $gt: 5, a: 1 }), { a: 1 });
    // { $gt: '' } -> {}
    assert.deepEqual(sanitize({ '$gt': '' }), {});
  });

  it('should do nothing for numbers and strings', function() {
    assert.equal(sanitize(1), 1);
    assert.equal(sanitize('a'), 'a');
  });

  it('should do nothing for arrays', function() {
    assert.deepEqual(sanitize([1, 2, 3]), [1, 2, 3]);
  });

  it('shouldnt be fooled by non-POJOs', function() {
    var Clazz = function() {
      this.$gt = 5;
      this.a = 1;
    };

    var o = sanitize(new Clazz());
    assert.deepEqual(o, { a: 1 });
  });

  it('should remove nested fields', function () {
    var obj = { username: { $ne: null }};
    assert.deepEqual(sanitize(obj), { username: {} });

    var issue3 = { "foo": { "bar": { "$ref": "foo" } } };
    assert.deepEqual(sanitize(issue3), { foo: { bar: {} } })
  });

  it('should do nothing for null or undefined', function () {
    assert.equal(null, sanitize(null));
    assert.equal(undefined, sanitize(undefined));
    assert.deepEqual(sanitize({ 'a': null }), { 'a': null });
  });
});

describe('sanitize express integration', function() {
  var app;
  var server;

  beforeEach(function() {
    app = express();
    app.use(require('body-parser').urlencoded({extended: true}));
    app.use(require('body-parser').json());
    server = app.listen(8081);
  });

  afterEach(function() {
    server.close();
  });

  it('should sensibly sanitize query params', function(done) {
    app.get('/test', function(req, res) {
      assert.equal(Object.keys(sanitize(req.query.username)).length, 0);
      done();
    });

    superagent.get('http://localhost:8081/test?username[$gt]=', function(){});
  });

  it('should sensibly sanitize body JSON', function(done) {
    app.post('/test', function(req, res) {
      var clean = sanitize(req.body.username);
      assert.deepEqual(clean, { 'a': 1 });
      assert.deepEqual(req.body.arr, [1, 2, 3]);
      done();
    });

    superagent.post('http://localhost:8081/test').send({
      username: { $gt: "", a: 1 },
      arr: [1, 2, 3]
    }).end();
  });
});
