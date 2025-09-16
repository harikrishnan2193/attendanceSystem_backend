const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Attendance = require('./attendanceModel');

const Break = sequelize.define('Break', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  attendance_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'attendance',
      key: 'id'
    }
  },
  break_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  break_end: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'breaks',
  timestamps: false
});

Break.belongsTo(Attendance, { foreignKey: 'attendance_id', onDelete: 'CASCADE' });
Attendance.hasMany(Break, { foreignKey: 'attendance_id', onDelete: 'CASCADE' });

module.exports = Break;
