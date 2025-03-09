const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

// Import routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB with retry mechanism
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:Suraj7972@cluster1.s8kyo.mongodb.net/application-system?retryWrites=true&w=majority&authSource=admin';
const MAX_RETRIES = 5;
let retryCount = 0;

console.log('Attempting to connect to MongoDB...');

function connectWithRetry() {
    console.log(`MongoDB connection attempt ${retryCount + 1} of ${MAX_RETRIES}`);
    
    return mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 60000,
        heartbeatFrequencyMS: 3000,
        family: 4
    })
    .then(() => {
        console.log('MongoDB connected successfully');
        console.log('Connection state:', mongoose.connection.readyState);
        console.log('Connected to database:', mongoose.connection.name);
    })
    .catch(err => {
        console.error('MongoDB connection error details:', {
            message: err.message,
            code: err.code,
            name: err.name,
            reason: err.reason ? JSON.stringify(err.reason) : 'No reason provided'
        });
        
        retryCount++;
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying connection in 5 seconds...`);
            setTimeout(connectWithRetry, 5000);
        } else {
            console.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
        }
    });
}

// Start the connection process
connectWithRetry();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'application-system-secret',
    resave: false,
    saveUninitialized: false, // Changed to false for better session handling
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true
    }
}));

// Database connection check middleware
app.use((req, res, next) => {
    // Skip for static files
    if (req.url.startsWith('/css') || req.url.startsWith('/js') || req.url.startsWith('/uploads')) {
        return next();
    }
    
    // Check MongoDB connection for API routes
    if (req.url.startsWith('/api') && mongoose.connection.readyState !== 1) {
        console.error('MongoDB not connected in middleware. State:', mongoose.connection.readyState);
        return res.status(503).json({ 
            message: 'Service temporarily unavailable', 
            error: 'Database connection issue' 
        });
    }
    
    next();
});

// Set view engine
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check route
app.get('/health', (req, res) => {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    let mongoStatus;
    
    switch(mongoState) {
        case 0: mongoStatus = 'disconnected'; break;
        case 1: mongoStatus = 'connected'; break;
        case 2: mongoStatus = 'connecting'; break;
        case 3: mongoStatus = 'disconnecting'; break;
        default: mongoStatus = 'unknown';
    }
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
        status: mongoState === 1 ? 'ok' : 'degraded',
        message: 'Server is running',
        mongoConnection: {
            status: mongoStatus,
            state: mongoState,
            host: mongoose.connection.host || 'not connected',
            database: mongoose.connection.name || 'not connected'
        },
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: PORT
        },
        memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
        },
        uptime: `${Math.round(process.uptime())} seconds`,
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// HTML routes
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/user/dashboard', (req, res) => {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'user-dashboard.html'));
});

app.get('/user/application', (req, res) => {
    // Check if user is logged in
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'application-form.html'));
});

// Admin routes
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    // Check if admin is logged in
    if (!req.session.adminId) {
        return res.redirect('/admin/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 