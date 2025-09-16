const Attendance = require("../models/attendanceModel");
const Break = require("../models/breaksModel");
const { Op } = require('sequelize');

// helper: get today's start and end of day
function getTodayRange() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

// get current break status
exports.getCurrentBreakStatus = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { startOfDay, endOfDay } = getTodayRange();

    // find today's attendance
    const todayAttendance = await Attendance.findOne({
      where: {
        user_id: userId,
        check_in: { [Op.between]: [startOfDay, endOfDay] }
      }
    });

    if (!todayAttendance) {
      return res.json({
        status: 'not_checked_in',
        message: 'Please check in first to use break functionality'
      });
    }

    // find latest break
    const currentBreak = await Break.findOne({
      where: { attendance_id: todayAttendance.id },
      order: [['id', 'DESC']]
    });

    let status = 'no_break';
    if (currentBreak) {
      if (currentBreak.break_start && !currentBreak.break_end) {
        status = 'on_break';
      } else if (currentBreak.break_start && currentBreak.break_end) {
        status = 'can_take_break';
      }
    }

    return res.json({
      status,
      button: status === 'on_break' ? 'End Break' : 'Take Break'
    });

  } catch (err) {
    console.error('Error in getCurrentBreakStatus:', err);
    res.status(500).json({ error: 'Server error while checking break status' });
  }
};


// start a break
exports.takeABreak = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { startOfDay, endOfDay } = getTodayRange();

    // find today's attendance
    const todayAttendance = await Attendance.findOne({
      where: {
        user_id: userId,
        check_in: { [Op.between]: [startOfDay, endOfDay] }
      }
    });

    if (!todayAttendance) {
      return res.status(404).json({ message: 'No attendance record found for today' });
    }

    // check if already on break
    const activeBreak = await Break.findOne({
      where: { attendance_id: todayAttendance.id, break_end: null }
    });

    if (activeBreak) {
      return res.status(400).json({ message: 'Already on a break' });
    }

    // create new break
    const newBreak = await Break.create({
      attendance_id: todayAttendance.id,
      break_start: new Date()
    });

    return res.json({ message: 'Break started', break: newBreak });

  } catch (err) {
    console.error('Error in takeABreak:', err);
    res.status(500).json({ error: 'Server error while starting break' });
  }
};

// end current break
exports.endCurrentBreak = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { startOfDay, endOfDay } = getTodayRange();

    // find today's attendance
    const todayAttendance = await Attendance.findOne({
      where: {
        user_id: userId,
        check_in: { [Op.between]: [startOfDay, endOfDay] }
      }
    });

    if (!todayAttendance) {
      return res.status(404).json({ message: 'No attendance record found for today' });
    }

    // find open break
    const activeBreak = await Break.findOne({
      where: { attendance_id: todayAttendance.id, break_end: null }
    });

    if (!activeBreak) {
      return res.status(400).json({ message: 'No active break to end' });
    }

    // end break
    await activeBreak.update({ break_end: new Date() });

    return res.json({ message: 'Break ended', break: activeBreak });

  } catch (err) {
    console.error('Error in endCurrentBreak:', err);
    res.status(500).json({ error: 'Server error while ending break' });
  }
};
