const express = require('express');
const { check } = require('express-validator');
const { auth, checkOwnership } = require('../middleware');
const { answersController, answerRepliesController } = require('../controllers');

const router = express.Router();

router.route('/:id')
  .get(answersController.getAnswers);

router.route('/:id/replies')
  .get(answerRepliesController.getReplies)
  .post(
    auth,
    check('body', 'Reply is required').not().isEmpty(),
    answerRepliesController.addReply,
  );

router.route('/:id')
  .post(
    auth,
    check('text', 'Answer is required').not().isEmpty(),
    answersController.addAnswer,
  );

router.route('/:id')
  .delete(
    auth,
    checkOwnership,
    answersController.deleteAnswer,
  );

router.route('/:id/upvote')
  .put(
    auth,
    answersController.upvoteAnswer,
  );

router.route('/:id/downvote')
  .put(
    auth,
    answersController.downvoteAnswer,
  );

module.exports = router;
