const Leave = require("../models/leaveModel");
const User = require("../models/userModel");
const { Op } = require('sequelize');

// reqest for leaves
exports.createLeave = async (req, res) => {
    try {
        const { userId, startDate, endDate, reason } = req.body;
        const tokenUserId = req.user?.user_id;

        if (!userId || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (userId !== tokenUserId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: 'Start date cannot be after end date' });
        }

        // check user role
        const user = await User.findOne({
            where: { user_id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // status based on user role
        const status = user.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

        const leave = await Leave.create({
            user_id: userId,
            start_date: startDate,
            end_date: endDate,
            reason: reason.trim(),
            status: status
        });

        res.status(201).json({
            message: user.role === 'ADMIN'
                ? 'Leave request auto-approved for admin'
                : 'Leave request submitted successfully',
            leave
        });

    } catch (err) {
        console.error('Create leave error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//get available leaves based on date
exports.getLeaves = async (req, res) => {
    try {
        const tokenUserId = req.user?.user_id;

        if (!tokenUserId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const user = await User.findOne({
            where: { user_id: tokenUserId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // start of day

        const whereCondition = {
            start_date: { [Op.gte]: today }
        };

        if (user.role === 'EMPLOYEE') {
            whereCondition.user_id = tokenUserId;
        } else if (user.role === 'ADMIN') {
            whereCondition.user_id = { [Op.ne]: tokenUserId };
        }

        const leaves = await Leave.findAll({
            where: whereCondition,
            attributes: ['user_id', 'reason', 'status', 'start_date', 'end_date'],
            include: [{
                model: User,
                attributes: ['name', 'email']
            }],
            order: [['start_date', 'ASC']]
        });

        const formattedLeaves = leaves.map(leave => {
            const startDate = new Date(leave.start_date);
            const isValid = startDate >= today;

            return {
                user_id: leave.user_id,
                name: leave.User.name,
                email: leave.User.email,
                reason: leave.reason,
                status: leave.status,
                start_date: leave.start_date,
                end_date: leave.end_date,
                valid: isValid
            };
        });

        res.status(200).json({
            message: 'Leaves retrieved successfully',
            leaves: formattedLeaves
        });

    } catch (err) {
        console.error('Get leaves error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//update leave status by admin
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;
        const tokenUserId = req.user?.user_id;

        if (!userId || !status) {
            return res.status(400).json({ message: 'userId and status are required' });
        }

        if (!tokenUserId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // check if requester is admin
        const adminUser = await User.findOne({
            where: { user_id: tokenUserId }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // find and update leave
        const leave = await Leave.findOne({
            where: { user_id: userId }
        });

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        await leave.update({ status });

        res.status(200).json({
            message: 'Leave status updated successfully',
            leave
        });

    } catch (err) {
        console.error('Update leave status error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

