const { validationResult } = require('express-validator');
const { responseHandler, asyncHandler } = require('../helpers');
const { answerRepliesService } = require('../services');

const Reply = (reply) => ({
  body: reply.body,
  userId: reply.userId,
  answerId: reply.answerId,
});

exports.getReplies = asyncHandler(async (req, res) => {
  try {
    await answerRepliesService.retrieveAll(req.params.id, (err, data) => {
      if (err) {
        console.log(err);
        return res.status(err.code).json(err);
      }
      return res.status(data.code).json(data);
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json(responseHandler(false, 500, 'Server Error', null));
  }
});

exports.addReply = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json(responseHandler(false, 400, errors.array()[0].msg, null));
  }

  try {
    const reply = Reply({
      body: req.body.body,
      userId: req.user.id,
      answerId: req.params.id,
    });

    await answerRepliesService.create(reply, (err, data) => {
      if (err) {
        console.log(err);
        return res.status(err.code).json(err);
      }
      return res.status(data.code).json(data);
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json(responseHandler(false, 500, 'Server Error', null));
  }
});
