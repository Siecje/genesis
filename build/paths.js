var path = require('path');
var appRoot = 'src/';

module.exports = {
  root: appRoot,
  js: appRoot + '**/*.js',
  vendor: 'vendor/' + '**/*.js',
  html: appRoot + '**/*.html',
  style: appRoot + '**/*.css',
  output: './dist/',
  docs:'./docs'
};
