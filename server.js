const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

// Configurare Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conectare la baza de date MongoDB
mongoose.connect('mongodb://localhost:27017/event_management', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Error connecting to MongoDB", err));

// Schemele Mongoose pentru utilizatori, evenimente și sarcini
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: { type: String, enum: ['admin', 'manager', 'staff'] }
});

const EventSchema = new mongoose.Schema({
    title: String,
    start: Date,
    end: Date,
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', UserSchema);
const Event = mongoose.model('Event', EventSchema);

// Funcție de autentificare a utilizatorilor
function authMiddleware(role) {
    return (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) return res.status(401).send('Access denied');
        try {
            const decoded = jwt.verify(token, 'SECRET_KEY');
            if (role && decoded.role !== role) return res.status(403).send('Forbidden');
            req.user = decoded;
            next();
        } catch (err) {
            res.status(400).send('Invalid token');
        }
    };
}

// Endpoint pentru înregistrare utilizatori
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();
    res.status(201).send('User registered');
});

// Endpoint pentru logare utilizatori
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user._id, role: user.role }, 'SECRET_KEY', { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(400).send('Invalid credentials');
    }
});

// Endpoint pentru adăugarea unui eveniment
app.post('/events', authMiddleware('manager'), async (req, res) => {
    const event = new Event(req.body);
    await event.save();
    res.status(201).send(event);
});

// Endpoint pentru trimiterea de emailuri
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

app.post('/sendEmail', (req, res) => {
    const { to, subject, text } = req.body;
    transporter.sendMail({ to, subject, text }, (err, info) => {
        if (err) {
            return res.status(500).send('Email sending failed');
        }
        res.status(200).send('Email sent');
    });
});

// Start server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
