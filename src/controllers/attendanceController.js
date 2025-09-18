const Attendance = require("../models/attendanceModel");
const Break = require("../models/breaksModel");
const { Op } = require('sequelize');

// get attendance status
exports.getAttendanceStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const tokenUserId = req.user?.user_id;

        if (userId !== tokenUserId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // check today's attendance
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayAttendance = await Attendance.findOne({
            where: {
                user_id: userId,
                check_in: {
                    [Op.gte]: startOfDay,
                    [Op.lt]: endOfDay
                }
            }
        });

        let status = 'not_checked_in';
        let isCheckedIn = false;
        let totalHours = null;
        let currentWorkingHours = null;

        if (todayAttendance) {
            if (todayAttendance.check_out) {
                // check-in and check-out exist
                status = 'checked_out';
                isCheckedIn = false;
                totalHours = todayAttendance.total_hours;
            } else {
                // only check-in exists - calculate current working hours
                status = 'checked_in';
                isCheckedIn = true;
                const currentTime = new Date();
                currentWorkingHours = ((currentTime - todayAttendance.check_in) / (1000 * 60 * 60)).toFixed(2);
            }
        }

        res.status(200).json({
            status,
            isCheckedIn,
            attendance: todayAttendance,
            totalHours,
            currentWorkingHours
        });

    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// check in
exports.checkInController = async (req, res) => {
    try {
        const { userId } = req.body;
        const tokenUserId = req.user?.user_id;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        if (!tokenUserId) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        if (userId !== tokenUserId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // check if user already checked in today
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const existingCheckIn = await Attendance.findOne({
            where: {
                user_id: userId,
                check_in: {
                    [Op.gte]: startOfDay,
                    [Op.lt]: endOfDay
                }
            }
        });

        if (existingCheckIn) {
            return res.status(400).json({ message: 'Already checked-in today' });
        }

        // create new attendance record
        const attendance = await Attendance.create({
            user_id: userId,
            check_in: new Date(),
            check_out: null
        });

        res.status(201).json({
            message: 'Check-in successful',
            attendance
        });

    } catch (err) {
        console.error('Check-in error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// check out
exports.checkOutController = async (req, res) => {
    try {
        const { userId } = req.body;
        const tokenUserId = req.user?.user_id;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        if (userId !== tokenUserId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // find today's check-in record
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const attendance = await Attendance.findOne({
            where: {
                user_id: userId,
                check_in: {
                    [Op.gte]: startOfDay,
                    [Op.lt]: endOfDay
                },
                check_out: null
            }
        });

        if (!attendance) {
            return res.status(400).json({ message: 'No active check-in found for today' });
        }

        // check for active break and close it
        const activeBreak = await Break.findOne({
            where: {
                attendance_id: attendance.id,
                break_end: null
            }
        });

        let breakMessage = '';
        if (activeBreak) {
            await activeBreak.update({ break_end: new Date() });
            breakMessage = ' Active break was automatically ended.';
        }

        // calculate total hours
        const checkOutTime = new Date();
        const totalHours = ((checkOutTime - attendance.check_in) / (1000 * 60 * 60)).toFixed(2);

        // update attendance
        await attendance.update({
            check_out: checkOutTime,
            total_hours: totalHours
        });

        res.status(200).json({
            message: `Check-out successful.${breakMessage}`,
            attendance: {
                ...attendance.toJSON(),
                check_out: checkOutTime,
                total_hours: totalHours
            }
        });

    } catch (err) {
        console.error('Check-out error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// get attendance history with pagination
exports.getAttendanceHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 5 } = req.query;
        const tokenUserId = req.user?.user_id;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        if (userId !== tokenUserId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const User = require("../models/userModel");
        const Leave = require("../models/leaveModel");
        const offset = (page - 1) * limit;

        // Check if user is admin
        const currentUser = await User.findByPk(userId);
        const isAdmin = currentUser?.role === 'ADMIN';

        // get attendance records with breaks and user info
        const attendanceRecords = await Attendance.findAll({
            where: isAdmin ? {} : { user_id: userId },
            include: [
                {
                    model: Break,
                    required: false
                },
                {
                    model: User,
                    attributes: ['user_id', 'name', 'email'],
                    required: true
                }
            ],
            order: [['check_in', 'DESC']]
        });

        // get leave records
        const leaveRecords = await Leave.findAll({
            where: isAdmin ? {} : { user_id: userId },
            include: isAdmin ? [{
                model: User,
                attributes: ['user_id', 'name', 'email'],
                required: true
            }] : []
        });

        // filter approved leaves
        const approvedLeaves = leaveRecords.filter(leave => leave.status === 'APPROVED');

        // attendance data
        const history = [];

        // add attendance records
        attendanceRecords.forEach(record => {
            const date = new Date(record.check_in).toISOString().split('T')[0];
            const checkIn = record.check_in ? new Date(record.check_in).toLocaleTimeString() : null;
            const checkOut = record.check_out ? new Date(record.check_out).toLocaleTimeString() : null;

            const breaks = record.Breaks ? record.Breaks.map(breakRecord => ({
                breakStart: new Date(breakRecord.break_start).toLocaleTimeString(),
                breakEnd: breakRecord.break_end ? new Date(breakRecord.break_end).toLocaleTimeString() : null,
                duration: breakRecord.break_end ?
                    ((new Date(breakRecord.break_end) - new Date(breakRecord.break_start)) / (1000 * 60)).toFixed(0) + ' mins' :
                    'Ongoing'
            })) : [];

            history.push({
                date,
                checkIn,
                checkOut,
                timeSpent: record.total_hours || '0.00',
                status: 'Present',
                breaks,
                user_id: record.User.user_id,
                name: record.User.name,
                email: record.User.email
            });
        });

        // add leave records
        approvedLeaves.forEach(leave => {
            const startDate = new Date(leave.start_date);
            const endDate = new Date(leave.end_date);

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const date = d.toISOString().split('T')[0];
                const existingAttendance = history.find(h => h.date === date && h.user_id === leave.user_id);
                if (!existingAttendance) {
                    history.push({
                        date,
                        checkIn: null,
                        checkOut: null,
                        timeSpent: '0.00',
                        status: 'Leave',
                        reason: leave.reason,
                        breaks: [],
                        user_id: isAdmin ? leave.User.user_id : leave.user_id,
                        name: isAdmin ? leave.User.name : currentUser.name,
                        email: isAdmin ? leave.User.email : currentUser.email
                    });
                }
            }
        });

        // sort by date descending
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        // pagination
        const totalRecords = history.length;
        const paginatedHistory = history.slice(offset, offset + parseInt(limit));
        const hasMore = offset + parseInt(limit) < totalRecords;

        res.status(200).json({
            message: 'Attendance history retrieved successfully',
            history: paginatedHistory,
            pagination: {
                currentPage: parseInt(page),
                totalRecords,
                hasMore,
                limit: parseInt(limit)
            }
        });

    } catch (err) {
        console.error('Get attendance history error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
