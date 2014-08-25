module.exports = function(v) {
  if (v instanceof Object) {
    for (var key in v) {
      if (/^\$/.test(key)) {
        delete v[key];
      }
    }
  }
  return v;
};
