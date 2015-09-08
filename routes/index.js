var express = require('express');
var crypto = require('crypto');
var router = express.Router();

User = require('../models/user.js');
Post = require('../models/post.js');
Comment = require('../models/comment.js');

module.exports = function(app) {
    // Homepage
	app.get('/', function(req, res) {
        // Check if it is the first page
        var page = req.query.p ? parseInt(req.query.p) : 1;
        // Retrieve 10 articles from page page
        Post.getTen(null, page, function(err, posts, total) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: 'Home',
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success', '').toString(),
                error: req.flash('error', '').toString()
            });
        });
        /* This part shows all the posts on the homepage
		Post.getAll(null, function(err, posts) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: 'Home',
                user: req.session.user,
                posts: posts,
                success: req.flash('success', '').toString(),
                error: req.flash('error', '').toString()
            });
        });
        */
	});

    // Register (to be removed in public version)
    app.get('/reg', checkNotLogIn);
	app.get('/reg', function(req, res) {
		res.render('reg', {
            title: 'Register',
            user: req.session.user,
            success: req.flash('success', '').toString(),
            error: req.flash('error', '').toString()
        });
	});

    app.post('reg', checkNotLogIn);
	app.post('/reg', function(req, res) {
        var password1 = req.body.password,
            password2 = req.body['passwordrepeat'];

        // Check if the two passwords are identical
        if (password2 != password1) {
            req.flash('error', 'Inconsistent password.');
            return res.redirect('/reg');
        }

        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');

        var newUser = new User({
            name : req.body.name,
            password : password,
            email: req.body.email
        });

        User.get(newUser.name, function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            // Check if the username already exists
            if (user) {
                req.flash('error', 'Username already exists.');
                return res.redirect('/reg');
            }

            newUser.save(function(err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', 'You have successfully registered!');
                res.redirect('/');
            });
        });
	});

    // Log In page
    app.get('/login', checkNotLogIn);
	app.get('/login', function(req, res) {
		res.render('login', {
            title: 'Log In',
            user: req.session.user,
            success: req.flash('success', '').toString(),
            error: req.flash('error', '').toString()
        });
	});

    app.post('/login', checkNotLogIn);
	app.post('/login', function(req, res) {
        // Generate the md5 of the password first
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');

        User.get(req.body.name, function(err, user) {
            // Check the user name
            if (!user) {
                req.flash('error', 'Invalid user name.');
                return res.redirect('/login');
            }

            // Check the password
            if (user.password != password) {
                req.flash('error', 'Invalid password.');
                return res.redirect('/login');
            }

            // When all is right
            req.session.user = user;
            req.flash('success', 'You have successfully logged in.');
            res.redirect('/');
        });
	});

    // New Post
    app.get('/post', checkLogIn);
	app.get('/post', function(req, res) {
        res.render('post', {
            title: 'New Post',
            user: req.session.user,
            success: req.flash('success', '').toString(),
            error: req.flash('error', '').toString()
        });
	});

    app.post('/post', checkLogIn);
	app.post('/post', function(req, res) {
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        var post = new Post(currentUser.name, req.body.title, req.body.post, tags);
        post.save(function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'You have successfully posted an article.');
            res.redirect('/');
        })
	});

    // Log out
    app.get('/logout', checkLogIn);
	app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', 'You have successfully logged out.');
        res.redirect('/');
	});

    /* This part was designed for uploading files
    app.get('/upload', checkLogIn);
    app.get('/upload', function(req, res) {
        res.render('upload', {
            title: 'Upload',
            user: req.session.user,
            success: req.flash('success', '').toString(),
            error: req.flash('error', '').toString()
        });
    });

    app.post('/upload', checkLogIn);
    app.post('/upload', function(req, res) {
        req.flash('success', 'You have successfully uploaded.');
        res.redirect('/upload');
    });
    */

    // Show the archive view of posts
    app.get('/archive', function(req, res) {
        Post.getArchive(function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: 'Archive',
                posts: posts,
                user: req.session.user,
                success: req.flash('success', '').toString(),
                error: req.flash('error', '').toString()
            });
        });
    });

    // Show tags
    app.get('/tags', function(req, res) {
        Post.getTags(function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: 'Tags',
                posts: posts,
                user: req.session.user,
                success: req.flash('success', '').toString(),
                error: req.flash('error', '').toString()
            });
        });
    });

    // Show posts of a particular tag
    app.get('/tags/:tag', function(req, res) {
        Post.getTag(req.params.tag, function(err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'Tag: ' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success', '').toString(),
                error: req.flash('error', '').toString()
            });
        });
    });

    // Show the posts of a particular user
    app.get('/u/:name', function(req, res) {
        User.get(req.params.name, function(err, user) {
            // Check if it is the first page
            var page = req.query.p ? parseInt(req.query.p) : 1;

            // Check if the user exists
            if (!user) {
                req.flash('error', 'Error. This user does not exist.');
                return res.redirect('/');
            }

            // Retrieve 10 articles from page page
            Post.getTen(user.name, page, function(err, posts, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    page: page,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 10 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success', '').toString(),
                    error: req.flash('error', '').toString()
                });
            });

            /* This part shows all the posts in one page
            // Find and return all posts of the user
            Post.getAll(user.name, function(err, posts) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success', '').toString(),
                    error: req.flash('error', '').toString()
                });
            });
            */
        });
    });

    // Show a particular article
    app.get('/u/:name/:day/:title', function(req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title,
            function(err, post) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                if (!post) {
                    req.flash('error', 'Error. This article does not exist.');
                    return res.redirect('/');
                }
                res.render('article', {
                    title: req.params.title,
                    post: post,
                    user: req.session.user,
                    success: req.flash('success', '').toString(),
                    error: req.flash('error', '').toString()
                });
            });
    });

    // Add comments
    app.post('/u/:name/:day/:title', function(req, res) {
        var date = new Date(),
            time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' '
                + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(
            req.params.name,
            req.params.day,
            req.params.title,
            comment
        );
        newComment.save(function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'You have successfully commented.');
            res.redirect('back');
        });
    });

    // The interface for editing an article
    app.get('/edit/:name/:day/:title', checkLogIn);
    app.get('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title,
            function(err, post) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                if (!post) {
                    req.flash('error', 'Error. This article does not exist.');
                    return res.redirect('/');
                }
                res.render('edit', {
                    title: 'Edit',
                    post: post,
                    user: req.session.user,
                    success: req.flash('success', '').toString(),
                    error: req.flash('error', '').toString()
                });
            });
    });

    // Edit an article
    app.post('/edit/:name/:day/:title', checkLogIn);
    app.post('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, tags,
            function(err) {
                var url = encodeURI('/u/' + req.params.name + '/'
                    + req.params.day + '/' + req.params.title);
                if (err) {
                    req.flash('error', err);
                    return res.redirect(url);
                }
                req.flash('success', 'You have successfully edited.');
                res.redirect(url);
            });
    });

    // Delete an article
    app.get('/delete/:name/:day/:title', checkLogIn);
    app.get('/delete/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        // Check if it is the authorized user accessing the link
        if (currentUser.name != req.params.name) {
            req.flash('error', 'Error. Unauthorized user.');
            return res.redirect('/');
        }
        Post.remove(currentUser.name, req.params.day, req.params.title,
            function (err) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                req.flash('success', 'You have successfully deleted the article.');
                return res.redirect('/');
            });
    });

    app.get('/secret', checkLogIn);
	app.get('/secret', function(req, res) {
		res.send('This is a secret!');
	});

    // Functions to check the login status
    function checkLogIn(req, res, next) {
        if (!req.session.user) {
            req.flash('error', 'You have not logged in.');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogIn(req, res, next) {
        if (req.session.user) {
            req.flash('error', 'You have already logged in.');
            res.redirect('/');
        }
        next();
    }
};
