const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
                    .populate('creator')
                    .skip((currentPage - 1) * perPage)
                    .limit(perPage);
    
        res.status(200).json({ 
            message: 'Fetched posts successfully.', 
            posts: posts,
            totalItems: totalItems 
        });
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId,
    });

    try {
        await post.save();
        creator = await User.findById(req.userId);
        creator.posts.push(post);
        await creator.save();
        res.status(201).json({
            message: 'Post created successfully',
            post: newPost,
            creator: { _id: creator._id, name: creator.name }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // post
    //     .save()
    //     .then(result => {
    //         return User.findById(req.userId);
    //     })
    //     .then(user => {
    //         creator = user;
    //         user.posts.push(post);
    //         return user.save();
    //     })
    //     .then(result => {
    //         res.status(201).json({
    //             message: 'Post created successfully',
    //             post: post,
    //             creator: { _id: creator._id, name: creator.name }
    //         });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Post fetched', post: post });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // Post.findById(postId)
    //     .then(post => {
    //         if (!post) {
    //             const error = new Error('Could not find post.');
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         res.status(200).json({ message: 'Post fetched', post: post });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     })
};

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }

    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        const result = await post.save();
        res.status(200).json({ message: 'Post updated!', post: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // Post.findById(postId)
    //     .then(post => {
    //         if (!post) {
    //             const error = new Error('Could not find post.');
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         if (post.creator.toString() !== req.userId) {
    //             const error = new Error('Not authorized');
    //             error.statusCode = 403;
    //             throw error;
    //         }
    //         if (imageUrl !== post.imageUrl) {
    //             clearImage(post.imageUrl);
    //         }
    //         post.title = title;
    //         post.imageUrl = imageUrl;
    //         post.content = content;
    //         return post.save();
    //     })
    //     .then(result => {
    //         res.status(200).json({ message: 'Post updated!', post: result });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }
        // check logged in user
        clearImage(post.imageUrl);
        let result = await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        res.status(200).json({ message: 'Deleted post.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

    // Post.findById(postId)
    //     .then(post => {
    //         if (!post) {
    //             const error = new Error('Could not find post.');
    //             error.statusCode = 404;
    //             throw error;
    //         }
    //         if (post.creator.toString() !== req.userId) {
    //             const error = new Error('Not authorized');
    //             error.statusCode = 403;
    //             throw error;
    //         }
    //         // check logged in user
    //         clearImage(post.imageUrl);
    //         return Post.findByIdAndRemove(postId);
    //     })
    //     .then(result => {
    //         return User.findById(req.userId);
    //     })
    //     .then(user => {
    //         user.posts.pull(postId);
    //         return user.save();
    //     })
    //     .then(result => {
    //         res.status(200).json({ message: 'Deleted post.' });
    //     })
    //     .catch(err => {
    //         if (!err.statusCode) {
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};