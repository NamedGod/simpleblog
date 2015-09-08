var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post, tags) {
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags = tags;
}

module.exports = Post;

// Save a post to the database
Post.prototype.save = function(callback) {
    var date = new Date();
    // Different time formats
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' '
            + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };

    // The post
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post,
        tags: this.tags,
        comments: []
    };

    // The database
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // Read all posts
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            // Insert the new post
            collection.insert(post, {
                safe: true
            }, function(err){
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

// Get ten posts (aka ten posts in one page)
Post.getTen = function(name, page, callback) {
    // From the database
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }

            // Find the posts through count
            collection.count(query, function(err, total) {
                // Skip (page-1)*10 results and return only ten
                // TODO Find another method without using skip and limit
                collection.find(query, {
                    skip: (page-1)*10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    // Parse for markdown
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total);
                });
            });
        });
    });
};

// Get all posts
Post.getAll = function(name, callback) {
    // From the database
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }

            // Find the post by the query
            collection.find(query).sort({
                time: -1
            }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    // Parse for markdown
                    docs.forEach(function(doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs);
                });
        });
    });
};

// Get a post
Post.getOne = function(name, day, title, callback) {
    // From the database
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // Find the exact post
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc){
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                if (!doc) {
                    return callback(null);
                }
                // Parse markdown into HTML
                if (doc) {
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                }

                callback(null, doc);
            });
        });
    });
};

// Get the original markdown of a post for editing
Post.edit = function (name, day, title, callback) {
    // From the database
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // Find the exact post
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                if (!doc) {
                    return callback(null);
                }
                // Return the markdown format post
                callback(null, doc);
            });
        });
    });
};

// Edit and update a post
Post.update = function(name, day, title, post, tags, callback) {
    // From the database
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // Update the post
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {
                    post: post,
                    tags: tags
                }
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
            console.log(tags);
        });
    });
};

// Delete an article
// Method set as "remove" to comply with the operation of mongodb
Post.remove = function(name, day, title, callback) {
    // From the database
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // Remove the article
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

// Get archive info of posts
Post.getArchive = function(callback) {
    // From the database
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // Generate an array with only name, time, and title
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time : -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// Get tags
Post.getTags = function(callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // Find distinct values
            collection.distinct("tags", function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// Get articles of a tag
Post.getTag = function(tag, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // Find posts whose tags array have the tag
            // Return the name, time, and title
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
