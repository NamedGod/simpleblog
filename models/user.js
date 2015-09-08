var mongodb = require('./db');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}

module.exports = User;

// Save user info
User.prototype.save = function(callback) {
	// The element to save to the database
	var user = {
		name: this.name,
		password: this.password,
		email: this.email
	};

	// Initialize connection with database
	mongodb.open(function(err,db) {
		if (err) {
			return callback(err);
		}
		// Read in the set of users
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Insert the user
			collection.insert(user, {
				safe: true
			}, function(err, user) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, user[0]);
			});
		});
	});
};

// Read user info
User.get = function(name, callback) {
	// Initialize connection with database
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// Read in the set of users
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Find the element with the name "name"
			collection.findOne({
				name: name
			}, function(err, user) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, user);
			});
		});
	});
};

