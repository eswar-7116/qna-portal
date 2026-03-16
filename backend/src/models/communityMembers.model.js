const { DataTypes } = require('sequelize');
const db = require('../config/db.config');

const CommunityMembersModel = db.define('community_members', {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
}, {
  db,
  tableName: 'community_members',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'PRIMARY',
      unique: true,
      using: 'BTREE',
      fields: [
        { name: 'id' },
      ],
    },
    {
      name: 'unique_community_user',
      unique: true,
      using: 'BTREE',
      fields: [
        { name: 'community_id' },
        { name: 'user_id' },
      ],
    },
  ],
});

module.exports = { CommunityMembersModel };
