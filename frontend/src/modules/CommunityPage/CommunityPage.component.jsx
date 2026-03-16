import React, { useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';

import {
  addCommunityMember,
  createCommunity,
  createCommunityQuestion,
  createCommunityQuestionAnswer,
  createCommunityQuestionComment,
  getCommunities,
  getCommunityMembers,
  getCommunityQuestionAnswers,
  getCommunityQuestionComments,
  getCommunityQuestions,
} from '../../api/communitiesApi';
import { usersData } from '../../api/usersApi';
import Spinner from '../../components/molecules/Spinner/Spinner.component';

import './CommunityPage.styles.scss';

const CommunityPage = ({ auth: { isAuthenticated, user } }) => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [members, setMembers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [commentsByQuestion, setCommentsByQuestion] = useState({});
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  const [communityForm, setCommunityForm] = useState({ name: '', description: '' });
  const [memberForm, setMemberForm] = useState({ userId: '' });
  const [questionForm, setQuestionForm] = useState({ title: '', body: '' });
  const [showCreateCommunityForm, setShowCreateCommunityForm] = useState(true);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const selectedCommunity = useMemo(
    () => communities.find((item) => String(item.id) === String(selectedCommunityId)) || null,
    [communities, selectedCommunityId],
  );

  const loadBaseData = async () => {
    if (!isAuthenticated) {
      setCommunities([]);
      setUsers([]);
      setSelectedCommunityId('');
      setMembers([]);
      setQuestions([]);
      setAnswersByQuestion({});
      setCommentsByQuestion({});
      setErrorMessage('');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [communitiesRes, usersRes] = await Promise.all([getCommunities(), usersData()]);
      const communitiesData = communitiesRes.data?.data || [];

      setCommunities(communitiesData);
      setUsers(usersRes.data?.data || []);

      if (communitiesData.length > 0) {
        const firstId = communitiesData[0].id;
        setSelectedCommunityId(firstId);
      } else {
        setSelectedCommunityId('');
      }

      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to load communities');
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityDetails = async (communityId) => {
    if (!communityId) {
      setMembers([]);
      setQuestions([]);
      return;
    }

    try {
      const [membersRes, questionsRes] = await Promise.all([
        getCommunityMembers(communityId),
        getCommunityQuestions(communityId),
      ]);

      const questionItems = questionsRes.data?.data || [];

      setMembers(membersRes.data?.data || []);
      setQuestions(questionItems);
      await loadQuestionInteractions(questionItems);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to load community details');
    }
  };

  const loadQuestionInteractions = async (questionItems) => {
    if (!questionItems || questionItems.length === 0) {
      setAnswersByQuestion({});
      setCommentsByQuestion({});
      return;
    }

    const entries = await Promise.all(questionItems.map(async (question) => {
      const questionId = question.id;

      const [answersRes, commentsRes] = await Promise.all([
        getCommunityQuestionAnswers(questionId).catch(() => ({ data: { data: [] } })),
        getCommunityQuestionComments(questionId).catch(() => ({ data: { data: [] } })),
      ]);

      return {
        questionId,
        answers: answersRes.data?.data || [],
        comments: commentsRes.data?.data || [],
      };
    }));

    const nextAnswers = {};
    const nextComments = {};

    entries.forEach((item) => {
      nextAnswers[item.questionId] = item.answers;
      nextComments[item.questionId] = item.comments;
    });

    setAnswersByQuestion(nextAnswers);
    setCommentsByQuestion(nextComments);
  };

  useEffect(() => {
    loadBaseData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedCommunityId) {
      loadCommunityDetails(selectedCommunityId);
    }
  }, [selectedCommunityId]);

  const handleCreateCommunity = async (event) => {
    event.preventDefault();

    try {
      setActionLoading(true);
      await createCommunity(communityForm);
      setCommunityForm({ name: '', description: '' });
      setSuccessMessage('Community created successfully');
      setShowCreateCommunityForm(false);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create community');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();

    if (!selectedCommunityId || !memberForm.userId) return;

    try {
      setActionLoading(true);
      await addCommunityMember(selectedCommunityId, { userId: memberForm.userId });
      setMemberForm({ userId: '' });
      setShowAddUserForm(false);
      setSuccessMessage('Member updated successfully');
      await loadCommunityDetails(selectedCommunityId);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to add user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAskQuestion = async (event) => {
    event.preventDefault();

    if (!selectedCommunityId) return;

    try {
      setActionLoading(true);
      await createCommunityQuestion(selectedCommunityId, questionForm);
      setQuestionForm({ title: '', body: '' });
      setSuccessMessage('Community question posted');
      await loadCommunityDetails(selectedCommunityId);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to post question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnswerQuestion = async (event, questionId) => {
    event.preventDefault();

    const body = (answerDrafts[questionId] || '').trim();
    if (!body) return;

    try {
      setActionLoading(true);
      await createCommunityQuestionAnswer(questionId, { body });
      setSuccessMessage('Answer posted');
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));

      const answersRes = await getCommunityQuestionAnswers(questionId).catch(() => ({ data: { data: [] } }));
      setAnswersByQuestion((prev) => ({
        ...prev,
        [questionId]: answersRes.data?.data || [],
      }));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to post answer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentQuestion = async (event, questionId) => {
    event.preventDefault();

    const body = (commentDrafts[questionId] || '').trim();
    if (!body) return;

    try {
      setActionLoading(true);
      await createCommunityQuestionComment(questionId, { body });
      setSuccessMessage('Comment posted');
      setCommentDrafts((prev) => ({ ...prev, [questionId]: '' }));

      const commentsRes = await getCommunityQuestionComments(questionId).catch(() => ({ data: { data: [] } }));
      setCommentsByQuestion((prev) => ({
        ...prev,
        [questionId]: commentsRes.data?.data || [],
      }));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setActionLoading(false);
    }
  };

  const clearMessages = () => {
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  if (loading) {
    return <Spinner type='page' width='75px' height='200px' />;
  }

  return (
    <div id='mainbar' className='community-page fc-black-800' onClick={clearMessages}>
      <div className='community-header'>
        <h1 className='headline'>Communities</h1>
        <p className='community-subtitle'>
          Create private circles, add members, and discuss with targeted community questions.
        </p>
        <div className='community-header-actions'>
          {!showCreateCommunityForm && (
            <button
              type='button'
              className='s-btn s-btn__filled community-toggle-btn'
              onClick={() => setShowCreateCommunityForm(true)}
              disabled={!isAuthenticated || actionLoading}
            >
              + Create Community
            </button>
          )}
        </div>
      </div>

      {errorMessage && <div className='community-message error'>{errorMessage}</div>}
      {successMessage && <div className='community-message success'>{successMessage}</div>}

      {!isAuthenticated && (
        <div className='community-message info'>
          Sign in to create a community, add members, and ask community questions.
        </div>
      )}

      <div className={`community-grid ${!showCreateCommunityForm ? 'single-column' : ''}`}>
        {showCreateCommunityForm && (
          <section className='community-card'>
            <div className='card-top'>
              <h2>Create Community</h2>
              <button
                type='button'
                className='s-btn s-btn__filled s-btn__xs'
                onClick={() => setShowCreateCommunityForm(false)}
              >
                Hide
              </button>
            </div>
            <p className='card-subtitle'>Set a name and description so members know this community's purpose.</p>
            <form onSubmit={handleCreateCommunity}>
              <input
                className='s-input'
                placeholder='Community name'
                value={communityForm.name}
                onChange={(e) => setCommunityForm({ ...communityForm, name: e.target.value })}
                required
                maxLength={120}
                disabled={!isAuthenticated || actionLoading}
              />
              <textarea
                className='s-textarea'
                placeholder='Community description'
                value={communityForm.description}
                onChange={(e) => setCommunityForm({ ...communityForm, description: e.target.value })}
                rows={4}
                required
                disabled={!isAuthenticated || actionLoading}
              />
              <button type='submit' className='s-btn s-btn__filled' disabled={!isAuthenticated || actionLoading}>
                Create
              </button>
            </form>
          </section>
        )}

        <section className='community-card'>
          <h2>All Communities</h2>
          <p className='card-subtitle'>Select a community to manage members and ask community-specific questions.</p>
          <div className='community-list'>
            {communities.length === 0 ? (
              <p>No communities yet. Create the first one.</p>
            ) : (
              communities.map((community) => (
                <button
                  key={community.id}
                  className={`community-item ${String(selectedCommunityId) === String(community.id) ? 'active' : ''}`}
                  onClick={() => setSelectedCommunityId(community.id)}
                >
                  <div>
                    <h3>{community.name}</h3>
                    <p>{community.description}</p>
                  </div>
                  <span>
                    {community.members_count || 0} members • {community.questions_count || 0} questions
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      {selectedCommunity && (
        <div className='community-grid second'>
          <section className='community-card'>
            <h2>Add User To Community</h2>
            <p className='card-subtitle'>Invite users into this space so only members collaborate here.</p>
            {!showAddUserForm ? (
              <button
                type='button'
                className='s-btn s-btn__filled add-user-trigger-btn'
                onClick={() => setShowAddUserForm(true)}
                disabled={!isAuthenticated || actionLoading}
              >
                + Add User
              </button>
            ) : (
              <form onSubmit={handleAddMember}>
                <select
                  className='s-select'
                  value={memberForm.userId}
                  onChange={(e) => setMemberForm({ userId: e.target.value })}
                  required
                  disabled={!isAuthenticated || actionLoading}
                >
                  <option value=''>Select user</option>
                  {users.map((item) => (
                    <option key={item.id} value={item.id}>{item.username}</option>
                  ))}
                </select>
                <div className='inline-form-actions'>
                  <button type='submit' className='s-btn s-btn__filled' disabled={!isAuthenticated || actionLoading}>
                    Add Member
                  </button>
                  <button
                    type='button'
                    className='s-btn s-btn__filled s-btn__xs'
                    onClick={() => setShowAddUserForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className='member-list'>
              <h3>Members</h3>
              {members.length === 0 ? (
                <p>No members in this community yet.</p>
              ) : (
                members.map((member) => (
                  <div className='member-item' key={member.id}>
                    <img src={member.user?.gravatar} alt={member.user?.username || 'member'} />
                    <div>
                      <strong>{member.user?.username || 'Unknown user'}</strong>
                      <span>Joined {moment(member.created_at).fromNow()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className='community-card ask-question-card'>
            <h2>Ask Community Question</h2>
            <p className='card-subtitle'>Post updates and questions focused on this selected community.</p>
            <form onSubmit={handleAskQuestion}>
              <input
                className='s-input'
                placeholder='Question title'
                value={questionForm.title}
                onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                maxLength={250}
                required
                disabled={!isAuthenticated || actionLoading}
              />
              <textarea
                className='s-textarea'
                placeholder='Question details'
                value={questionForm.body}
                onChange={(e) => setQuestionForm({ ...questionForm, body: e.target.value })}
                rows={5}
                required
                disabled={!isAuthenticated || actionLoading}
              />
              <button type='submit' className='s-btn s-btn__filled' disabled={!isAuthenticated || actionLoading}>
                Post Question
              </button>
            </form>

            <div className='question-list'>
              <h3>Community Questions</h3>
              {questions.length === 0 ? (
                <p>No community questions yet.</p>
              ) : (
                questions.map((question) => (
                  <article className='question-item' key={question.id}>
                    <h4>{question.title}</h4>
                    <p>{question.body}</p>
                    <span>
                      Asked by {question.user?.username || 'Unknown user'} • {moment(question.created_at).fromNow()}
                    </span>

                    <div className='question-replies'>
                      <div className='reply-block'>
                        <h5>Answers ({(answersByQuestion[question.id] || []).length})</h5>
                        <form onSubmit={(event) => handleAnswerQuestion(event, question.id)}>
                          <textarea
                            className='s-textarea compact'
                            placeholder='Write an answer'
                            value={answerDrafts[question.id] || ''}
                            onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))}
                            rows={2}
                            disabled={!isAuthenticated || actionLoading}
                          />
                          <button type='submit' className='s-btn s-btn__filled' disabled={!isAuthenticated || actionLoading}>
                            Answer
                          </button>
                        </form>
                        <div className='reply-list'>
                          {(answersByQuestion[question.id] || []).map((answer) => (
                            <div key={answer.id} className='reply-item'>
                              <p>{answer.body}</p>
                              <span>{answer.user?.username || 'Unknown user'} • {moment(answer.created_at).fromNow()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className='reply-block'>
                        <h5>Comments ({(commentsByQuestion[question.id] || []).length})</h5>
                        <form onSubmit={(event) => handleCommentQuestion(event, question.id)}>
                          <textarea
                            className='s-textarea compact'
                            placeholder='Write a comment'
                            value={commentDrafts[question.id] || ''}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))}
                            rows={2}
                            disabled={!isAuthenticated || actionLoading}
                          />
                          <button type='submit' className='s-btn s-btn__filled' disabled={!isAuthenticated || actionLoading}>
                            Comment
                          </button>
                        </form>
                        <div className='reply-list'>
                          {(commentsByQuestion[question.id] || []).map((comment) => (
                            <div key={comment.id} className='reply-item'>
                              <p>{comment.body}</p>
                              <span>{comment.user?.username || 'Unknown user'} • {moment(comment.created_at).fromNow()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {isAuthenticated && user && (
        <div className='community-footnote'>
          Signed in as <strong>{user.username}</strong>
        </div>
      )}
    </div>
  );
};

CommunityPage.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(CommunityPage);
