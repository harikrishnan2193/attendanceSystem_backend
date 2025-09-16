const User = require("../models/userModel");
const Attendance = require("../models/attendanceModel");
const Leave = require("../models/leaveModel");
const Break = require("../models/breaksModel");
const { Op } = require('sequelize');

// get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const { userId } = req.params;
        const tokenUserId = req.user?.user_id;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        if (!tokenUserId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        if (userId !== tokenUserId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // check user is admin
        const adminUser = await User.findOne({
            where: { user_id: userId }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You are not privileged to check the details' });
        }

        // get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // get all employees
        const employees = await User.findAll({
            attributes: ['name', 'user_id', 'email'],
            where: {
                role: 'EMPLOYEE',
                status: 'ACTIVE'
            }
        });

        const employeeList = [];

        for (const employee of employees) {
            // check today's attendance
            const todayAttendance = await Attendance.findOne({
                where: {
                    user_id: employee.user_id,
                    check_in: { [Op.gte]: startOfDay, [Op.lt]: endOfDay }
                }
            });

            // check if on leave today
            const todayLeave = await Leave.findOne({
                where: {
                    user_id: employee.user_id,
                    status: 'APPROVED',
                    start_date: { [Op.lte]: today },
                    end_date: { [Op.gte]: today }
                }
            });

            let status = 'Not Checked In';

            if (todayLeave) {
                status = 'On Leave';
            } else if (todayAttendance) {
                if (todayAttendance.check_out) {
                    status = 'Checked Out';
                } else {
                    // check if on break
                    const activeBreak = await Break.findOne({
                        where: {
                            attendance_id: todayAttendance.id,
                            break_end: null
                        }
                    });

                    status = activeBreak ? 'On Break' : 'Checked In';
                }
            }

            employeeList.push({
                name: employee.name,
                user_id: employee.user_id,
                email: employee.email,
                status
            });
        }

        res.status(200).json({
            message: 'Employees retrieved successfully',
            employees: employeeList
        });

    } catch (err) {
        console.error('Get all employees error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// delete employee
exports.deleteEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const tokenUserId = req.user?.user_id;

        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        if (!tokenUserId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // check if requester is admin
        const adminUser = await User.findOne({
            where: { user_id: tokenUserId }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({ message: 'You are not privileged to delete employees' });
        }

        // check if employee exists and is actually an employee
        const employee = await User.findOne({
            where: {
                user_id: employeeId,
                role: 'EMPLOYEE'
            }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // prevent admin deleting admin
        if (employeeId === tokenUserId) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // delete employee
        // await employee.destroy();
        // await employee.update({ status: 'DELETED' });

        // delete related data manually
        await Leave.destroy({ where: { user_id: employeeId } });

        // delete breaks through attendance
        const attendanceRecords = await Attendance.findAll({
            where: { user_id: employeeId }
        });

        for (const attendance of attendanceRecords) {
            await Break.destroy({ where: { attendance_id: attendance.id } });
        }

        await Attendance.destroy({ where: { user_id: employeeId } });

        // update user status to DELETED
        await employee.update({ status: 'DELETED' });

        res.status(200).json({
            message: 'Employee deleted successfully'
        });

    } catch (err) {
        console.error('Delete employee error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// assign new employee
exports.assignNewEmployee = async (req, res) => {
    try {
        const { employeeUserId } = req.body;
        const tokenUserId = req.user?.user_id;

        if (!employeeUserId) {
            return res.status(400).json({ message: 'employeeUserId is required' });
        }

        if (!tokenUserId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // check admin privilege
        const adminUser = await User.findOne({
            where: { user_id: tokenUserId }
        });

        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // check if user exists
        const existingUser = await User.findOne({
            where: { user_id: employeeUserId }
        });

        if (!existingUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (existingUser.status === 'ACTIVE') {
            return res.status(400).json({ message: 'User is already an active employee' });
        }

        // reactivate deleted/inactive user
        await existingUser.update({
            status: 'ACTIVE'
        });

        return res.status(200).json({
            message: 'Employee assigned successfully',
            employee: existingUser
        });

    } catch (err) {
        console.error('Assign employee error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};



