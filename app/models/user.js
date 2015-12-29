var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    // this.on('creating', function(model, attrs, options) {
    //   bcrypt.hash(model.get('hash'), null, null, function(err, hash) {
    //     model.set('hash', hash);
    //   });
    // });
  }
});


module.exports = User;