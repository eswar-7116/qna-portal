const express = require('express');
const { check } = require('express-validator');
const { auth, checkOwnership } = require('../middleware');
const { postsController } = require('../controllers');

const router = express.Router();

router.route('/')
  .get(postsController.getPosts);

router.route('/tag/:tagname')
  .get(postsController.getTagPosts);

router.route('/:id')
  .get(postsController.getSinglePost);

router.route('/user/:id')
  .get(postsController.getUserPosts);

router.route('/')
  .post(
    auth,
    postsController.addPost,
  );

router.route('/:id')
  .delete(
    auth,
    checkOwnership,
    postsController.deletePost,
  );

module.exports = router;
