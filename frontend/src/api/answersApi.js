import axios from 'axios';

import {
  allAnswersData as _allAnswersData,
  createSingleAnswer as _createSingleAnswer,
  deleteSingleAnswer as _deleteSingleAnswer,
  upvoteAnswerUrl,
  downvoteAnswerUrl
} from './urls';

export const allAnswersData = (id) => {
  return axios.get(_allAnswersData.replace('{id}', id));
}

export const createSingleAnswer = (postId, formData) => {
  const config_headers = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  return axios.post(_createSingleAnswer.replace('{postId}', postId), formData, config_headers);
}

export const deleteSingleAnswer = (AnswerId) => {
  return axios.delete(_deleteSingleAnswer.replace('{AnswerId}', AnswerId));
}

export const upvoteAnswer = (id) => {
  return axios.put(upvoteAnswerUrl.replace('{id}', id));
}

export const downvoteAnswer = (id) => {
  return axios.put(downvoteAnswerUrl.replace('{id}', id));
}