const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

require('dotenv').config();

const User = require('../models/user');
const FeedController = require('../controllers/feed');

describe('Feed Controller', function() {
    before(function(done) {
        mongoose
            .connect(process.env.MONGO_DB_URI_TESTING)
            .then(result => {
                const user = new User({
                    email: 'test@test.com',
                    password: 'tester',
                    name: 'Test',
                    posts: [],
                    _id: '5d41accf5375924a431bd598'
                });
                return user.save();
            })
            .then(() => {
                done();
            })
    });

    it('should add a created post to the posts of the creator', function(done) {
        const req = {
            body: {
                title: 'test',
                content: 'a test post',
            },
            file: {
                path: 'abc'
            },
            userId: '5d41accf5375924a431bd598'
        };

        const res = { 
            status: function() {
                return this;
            }, 
            json: function() {} 
        };

        FeedController.createPost(req, res, () => {}).then(savedUser => {
            expect(savedUser).to.have.property('posts');
            expect(savedUser.posts).to.have.length(1);
            done();
        });
    });

    after(function(done) {
        User.deleteMany({})
            .then(() => {
                return mongoose.disconnect();
            })
            .then(() => {
                done();
            });
    });
});