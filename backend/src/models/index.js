const { UsersModel } = require('./users.model');
const { PostsModel } = require('./posts.model');
const { TagsModel } = require('./tags.model');
const { PostTagModel } = require('./posttag.model');
const { AnswersModel } = require('./answers.model');
const { CommentsModel } = require('./comments.model');
const { CommunitiesModel } = require('./communities.model');
const { CommunityMembersModel } = require('./communityMembers.model');
const { CommunityQuestionsModel } = require('./communityQuestions.model');
const { CommunityQuestionAnswersModel } = require('./communityQuestionAnswers.model');
const { CommunityQuestionCommentsModel } = require('./communityQuestionComments.model');

UsersModel.hasMany(PostsModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});
PostsModel.belongsTo(UsersModel);

UsersModel.hasMany(CommentsModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});
CommentsModel.belongsTo(UsersModel);

UsersModel.hasMany(AnswersModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});
AnswersModel.belongsTo(UsersModel);

PostsModel.hasMany(CommentsModel, {
  foreignKey: { name: 'post_id', allowNull: false },
});
CommentsModel.belongsTo(PostsModel);

PostsModel.hasMany(AnswersModel, {
  foreignKey: { name: 'post_id', allowNull: false },
});
AnswersModel.belongsTo(PostsModel);

PostsModel.belongsToMany(TagsModel, { through: PostTagModel, foreignKey: { name: 'post_id', allowNull: false } });
TagsModel.belongsToMany(PostsModel, { through: PostTagModel, foreignKey: { name: 'tag_id', allowNull: false } });

UsersModel.hasMany(CommunitiesModel, {
  foreignKey: { name: 'creator_id', allowNull: false },
  as: 'created_communities',
});
CommunitiesModel.belongsTo(UsersModel, {
  foreignKey: { name: 'creator_id', allowNull: false },
  as: 'creator',
});

CommunitiesModel.hasMany(CommunityMembersModel, {
  foreignKey: { name: 'community_id', allowNull: false },
  as: 'members',
});
CommunityMembersModel.belongsTo(CommunitiesModel, {
  foreignKey: { name: 'community_id', allowNull: false },
});

UsersModel.hasMany(CommunityMembersModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});
CommunityMembersModel.belongsTo(UsersModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});

CommunitiesModel.hasMany(CommunityQuestionsModel, {
  foreignKey: { name: 'community_id', allowNull: false },
  as: 'questions',
});
CommunityQuestionsModel.belongsTo(CommunitiesModel, {
  foreignKey: { name: 'community_id', allowNull: false },
});

UsersModel.hasMany(CommunityQuestionsModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});
CommunityQuestionsModel.belongsTo(UsersModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});

CommunityQuestionsModel.hasMany(CommunityQuestionAnswersModel, {
  foreignKey: { name: 'community_question_id', allowNull: false },
  as: 'answers',
});
CommunityQuestionAnswersModel.belongsTo(CommunityQuestionsModel, {
  foreignKey: { name: 'community_question_id', allowNull: false },
});

UsersModel.hasMany(CommunityQuestionAnswersModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});
CommunityQuestionAnswersModel.belongsTo(UsersModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});

CommunityQuestionsModel.hasMany(CommunityQuestionCommentsModel, {
  foreignKey: { name: 'community_question_id', allowNull: false },
  as: 'comments',
});
CommunityQuestionCommentsModel.belongsTo(CommunityQuestionsModel, {
  foreignKey: { name: 'community_question_id', allowNull: false },
});

UsersModel.hasMany(CommunityQuestionCommentsModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});
CommunityQuestionCommentsModel.belongsTo(UsersModel, {
  foreignKey: { name: 'user_id', allowNull: false },
});

module.exports = {
  UsersModel,
  PostsModel,
  TagsModel,
  PostTagModel,
  AnswersModel,
  CommentsModel,
  CommunitiesModel,
  CommunityMembersModel,
  CommunityQuestionsModel,
  CommunityQuestionAnswersModel,
  CommunityQuestionCommentsModel,
};
