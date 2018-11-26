var sanitize = require('./index.js');
var assert = require('assert');
var express = require('express');
var superagent = require('superagent');

describe('sanitize', function() {
  it('should remove fields that start with $ from objects', function() {
    assert.equal(0, Object.keys(sanitize({ $gt: 5 })).length);

    var o = sanitize({ $gt: 5, a: 1 });
    assert.equal(1, Object.keys(o).length);
    assert.equal('a', Object.keys(o)[0]);
    assert.equal(1, o.a);
  });

  it('should do nothing for numbers and strings', function() {
    assert.equal(1, sanitize(1));
    assert.equal('a', sanitize('a'));
  });

  it('should do nothing for arrays', function() {
    assert.deepEqual([1, 2, 3], sanitize([1, 2, 3]));
  });

  it('shouldnt be fooled by non-POJOs', function() {
    var Clazz = function() {
      this.$gt = 5;
      this.a = 1;
    };

    var o = sanitize(new Clazz());
    assert.equal(1, Object.keys(o).length);
    assert.equal('a', Object.keys(o)[0]);
    assert.equal(1, o.a);
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
      assert.equal(0, Object.keys(sanitize(req.query.username)).length);
      done();
    });

    superagent.get('http://localhost:8081/test?username[$gt]=', function(){});
  });

  it('should sensibly sanitize body JSON', function(done) {
    app.post('/test', function(req, res) {
      var clean = sanitize(req.body.username);
      assert.equal(1, Object.keys(clean).length);
      assert.equal('a', Object.keys(clean)[0]);
      assert.equal(1, clean.a);

      assert.deepEqual([1, 2, 3], req.body.arr);

      done();
    });

    superagent.post('http://localhost:8081/test').send({
      username: { $gt: "", a: 1 },
      arr: [1, 2, 3]
    }).end();
  });
});
