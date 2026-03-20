const Sequelize = require('sequelize');
const utils = require('../utils');
const { responseHandler } = require('../helpers');
const { AnswerRepliesModel, UsersModel } = require('../models');

exports.create = async (newReply, result) => {
  await AnswerRepliesModel.create({
    body: newReply.body,
    user_id: newReply.userId,
    answer_id: newReply.answerId,
  })
    .then((response) => {
      result(
        null,
        responseHandler(true, 200, 'Reply Added', response.id),
      );
    })
    .catch((error) => {
      console.log(error);
      result(responseHandler(false, 500, 'Some error occurred while adding the reply.', null), null);
    });
};

exports.createInternal = async ({ body, userId, answerId }) => AnswerRepliesModel.create({
  body,
  user_id: userId,
  answer_id: answerId,
});

exports.retrieveAll = async (answerId, result) => {
  const queryResult = await AnswerRepliesModel.findAll({
    where: {
      answer_id: answerId,
    },
    attributes: [
      'id',
      'answer_id',
      'user_id',
      'body',
      'created_at',
      [Sequelize.literal('user.username'), 'username'],
      [Sequelize.literal('user.gravatar'), 'gravatar'],
    ],
    include: {
      model: UsersModel,
      attributes: [],
    },
    order: [['created_at', 'ASC']],
  }).catch((error) => {
    console.log(error);
    return result(responseHandler(false, 500, 'Something went wrong!', null), null);
  });

  const queryResultMap = queryResult.map((reply) => utils.array.sequelizeResponse(
    reply,
    'id',
    'answer_id',
    'user_id',
    'body',
    'created_at',
    'username',
    'gravatar',
  ));

  return result(null, responseHandler(true, 200, 'Success', queryResultMap));
};
