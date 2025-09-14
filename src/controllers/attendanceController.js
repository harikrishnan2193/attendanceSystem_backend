const Attendance = require("../models/attendanceModel");
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

        // calculate total hours
        const checkOutTime = new Date();
        const totalHours = ((checkOutTime - attendance.check_in) / (1000 * 60 * 60)).toFixed(2);

        // update attendance
        await attendance.update({
            check_out: checkOutTime,
            total_hours: totalHours
        });

        res.status(200).json({
            message: 'Check-out successful',
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
