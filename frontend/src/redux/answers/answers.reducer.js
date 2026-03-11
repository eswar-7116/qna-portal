import {
  GET_ANSWERS,
  ANSWER_ERROR,
  ADD_ANSWER,
  DELETE_ANSWER,
  UPDATE_ANSWER_VOTES,
} from './answers.types';

const initialState = {
  answers: [],
  loading: true,
  error: {},
};

export default function answers(state = initialState, action) {
  switch (action.type) {
    case UPDATE_ANSWER_VOTES:
      return {
        ...state,
        answers: state.answers.map((answer) =>
          answer.id === action.payload.id
            ? { ...answer, upvotes: action.payload.upvotes, downvotes: action.payload.downvotes }
            : answer
        ),
        loading: false,
      };
    case GET_ANSWERS:
      return {
        ...state,
        answers: action.payload,
        loading: false,
      };
    case ADD_ANSWER:
      return {
        ...state,
        answers: [...state.answers, action.payload],
        loading: false,
      };
    case DELETE_ANSWER:
      return {
        ...state,
        answers: state.answers.filter((answer) => answer.id !== action.payload),
        loading: false,
      };
    case ANSWER_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
}
