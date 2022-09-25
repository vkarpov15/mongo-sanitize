mongo-sanitize
==============

For the passionately lazy, a standalone module that sanitizes inputs against [query selector injection attacks](https://web.archive.org/web/20220301171109/https://blog.websecurify.com/2014/08/hacking-nodejs-and-mongodb.html):

```
var sanitize = require('mongo-sanitize');

// The sanitize function will strip out any keys that start with '$' in the input,
// so you can pass it to MongoDB without worrying about malicious users overwriting
// query selectors.
var clean = sanitize(req.params.username);

Users.findOne({ name: clean }, function(err, doc) {
  // ...
});
```

If `sanitize()` is passed an object, it will mutate the original object.
