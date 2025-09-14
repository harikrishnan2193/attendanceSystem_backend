const User = require("../models/userModel");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// register
exports.registerController = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        console.log(req.body);


        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // check user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(406).json({ message: 'User already exists, Please login' });
        }

        // hash password with salt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // create new user
        const newUser = await User.create({
            user_id: uuidv4(),
            name,
            email,
            password: hashedPassword
        });

        // remove password from response
        const { password: _, ...userResponse } = newUser.toJSON();

        res.status(201).json({
            message: 'User registered successfully, Please login the account',
            user: userResponse
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// login
exports.loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // check user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid user name or password' });
        }

        // generate JWT token
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // remove password from response
        const { password: _, ...userResponse } = user.toJSON();

        res.status(200).json({
            message: 'Login successful',
            user: userResponse,
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
