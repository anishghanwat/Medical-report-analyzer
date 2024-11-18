const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Debug logging
        console.log('Registration attempt:', { email, name });

        // Validate input
        if (!email || !password || !name) {
            console.log('Validation failed: Missing fields');
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            email,
            password: hashedPassword,
            name
        });

        console.log('Attempting to save user...');
        await user.save();
        console.log('User saved successfully');

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send response
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Registration error:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Email already registered'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: Object.values(error.errors).map(err => err.message).join(', ')
            });
        }

        res.status(500).json({
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}; 