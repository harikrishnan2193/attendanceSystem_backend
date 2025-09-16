const User = require("../models/userModel");

exports.checkUserExists = async (req, res, next) => {
    try {
        const tokenUserId = req.user?.user_id;
        
        if (!tokenUserId) {
            return next();
        }

        const user = await User.findOne({
            where: { user_id: tokenUserId }
        });

        if (!user) {
            return res.status(404).json({ 
                message: 'Your account has been deleted. Please contact administrator.' 
            });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({
                message: 'Your account is inactive. Please contact administrator for add you again.'
            });
        }

        next();
    } catch (err) {
        console.error('User exists check error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
