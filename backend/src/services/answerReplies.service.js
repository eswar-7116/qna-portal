const { responseHandler } = require('../helpers');
const { AnswerRepliesRepository, AnswersRepository } = require('../repositories');
const aiService = require('./ai.service');

exports.create = async (newReply, result) => {
  await AnswerRepliesRepository.create(newReply, async (err, data) => {
    if (err) {
      return result(err, null);
    }

    try {
      const answer = await AnswersRepository.findById(newReply.answerId);
      const answerUsername = answer?.get ? answer.get('username') : answer?.username;
      const answerUserId = answer?.get ? answer.get('user_id') : answer?.user_id;

      if (answer && answerUsername === 'ramineni_ai' && newReply.userId !== answerUserId) {
        await aiService.createAssistantReplyForAnswer({
          answerId: newReply.answerId,
          replyBody: newReply.body,
          answerBody: answer?.get ? answer.get('body') : answer?.body,
        });
      }
    } catch (error) {
      console.log('AI follow-up reply failed:', error.message);
    }

    return result(null, data);
  });
};

exports.retrieveAll = async (answerId, result) => {
  const answer = await AnswersRepository.findById(answerId);
  if (!answer) {
    return result(responseHandler(false, 404, 'Answer not found', null), null);
  }

  return AnswerRepliesRepository.retrieveAll(answerId, result);
};
