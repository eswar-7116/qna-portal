const Sequelize = require('sequelize');
const utils = require('../utils');
const { responseHandler } = require('../helpers');
const { UsersModel, AnswersModel } = require('../models');

exports.create = async (newAnswer, result) => {
  await AnswersModel.create({
    body: newAnswer.body,
    user_id: newAnswer.userId,
    post_id: newAnswer.postId,
  })
    .then((response) => {
      result(
        null,
        responseHandler(true, 200, 'Answer Added', response.id),
      );
    })
    .catch((error) => {
      console.log(error);
      result(responseHandler(false, 500, 'Some error occurred while adding the answer.', null), null);
    });
};

exports.remove = async (id, result) => {
  await AnswersModel.destroy({
    where: { id },
  })
    .then(() => {
      result(null, responseHandler(true, 200, 'Answer Removed', null));
    })
    .catch((error) => {
      console.log(error.message);
      result(responseHandler(false, 404, 'This answer doesn\'t exists', null), null);
    });
};

exports.removePostAnswers = async (postId, t) => {
  await AnswersModel
    .destroy({ where: { post_id: postId } }, { transaction: t })
    .then(() => ({ status: true, message: 'Answer Removed' }))
    .catch((error) => {
      throw new Error(`Answer Delete Operation Failed: ${error}`);
    });
};

exports.retrieveAll = async (postId, result) => {
  const queryResult = await AnswersModel.findAll({
    where: {
      post_id: postId,
    },
    attributes: [
      'id',
      'user_id',
      'post_id',
      'body',
      'created_at',
      'upvotes',
      'downvotes',
      [Sequelize.literal('user.username'), 'username'],
      [Sequelize.literal('user.gravatar'), 'gravatar'],
    ],
    include: {
      model: UsersModel,
      attributes: [],
    },
  }).catch((error) => {
    console.log(error);
    return result(responseHandler(false, 500, 'Something went wrong!', null), null);
  });

  const queryResultMap = queryResult.map((answer) => utils.array.sequelizeResponse(
    answer,
    'id',
    'user_id',
    'post_id',
    'body',
    'created_at',
    'upvotes',
    'downvotes',
    'username',
    'gravatar',
  ));

  if (utils.conditional.isArrayEmpty(queryResultMap)) {
    console.log('error: ', 'There are no answers');
    return result(responseHandler(false, 404, 'There are no answers', null), null);
  }

  return result(null, responseHandler(true, 200, 'Success', queryResultMap));
};

exports.upvote = async (id, userId, result) => {
  try {
    const answer = await AnswersModel.findByPk(id);
    if (!answer) return result(responseHandler(false, 404, 'Answer not found', null), null);
    
    let upvotes = Array.isArray(answer.upvotes) ? [...answer.upvotes] : [];
    let downvotes = Array.isArray(answer.downvotes) ? [...answer.downvotes] : [];

    if (upvotes.includes(userId)) {
      upvotes = upvotes.filter(u => u !== userId);
    } else {
      upvotes.push(userId);
      downvotes = downvotes.filter(u => u !== userId);
    }

    await answer.update({ upvotes, downvotes });
    return result(null, responseHandler(true, 200, 'Upvoted', answer));
  } catch (error) {
    console.log(error);
    return result(responseHandler(false, 500, 'Error upvoting', null), null);
  }
};

exports.downvote = async (id, userId, result) => {
  try {
    const answer = await AnswersModel.findByPk(id);
    if (!answer) return result(responseHandler(false, 404, 'Answer not found', null), null);

    let upvotes = Array.isArray(answer.upvotes) ? [...answer.upvotes] : [];
    let downvotes = Array.isArray(answer.downvotes) ? [...answer.downvotes] : [];

    if (downvotes.includes(userId)) {
      downvotes = downvotes.filter(u => u !== userId);
    } else {
      downvotes.push(userId);
      upvotes = upvotes.filter(u => u !== userId);
    }

    await answer.update({ upvotes, downvotes });
    return result(null, responseHandler(true, 200, 'Downvoted', answer));
  } catch (error) {
    console.log(error);
    return result(responseHandler(false, 500, 'Error downvoting', null), null);
  }
};
