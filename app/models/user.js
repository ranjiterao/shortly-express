var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      // MAGIC HAPPENS HERE WITH THE PASSWORD
      var hashThis = model.get('hash');
      // realHash = run bcrypt on hashThis
      model.set('hash', realHash);
    });
  }
});


module.exports = User;