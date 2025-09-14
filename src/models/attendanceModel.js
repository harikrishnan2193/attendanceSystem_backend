const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./userModel');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: {
      model: 'users', 
      key: 'user_id'
    }
  },
  check_in: {
    type: DataTypes.DATE,
    allowNull: true
  },
  check_out: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_hours: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true
  }
}, {
  tableName: 'attendance',
  timestamps: false 
});

Attendance.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Attendance, { foreignKey: 'user_id', onDelete: 'CASCADE' });

module.exports = Attendance;
