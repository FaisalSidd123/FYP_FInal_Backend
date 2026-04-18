const express = require('express');
const cors = require('cors');
const diagnosisRoutes = require('./Routes/diagnosis');
const userRoutes = require('./Routes/users');
const caseQueriesRoutes = require('./Routes/caseQueries');
const statsRoutes = require('./Routes/stats');
const profileRoutes = require('./Routes/profile');
const processXrayRoutes = require('./Routes/getResponse');


const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Root Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'HealthSimulator API is Running successfully!' 
  });
});

// Routes
app.use('/api/diagnosis', diagnosisRoutes); // ✅ Uncomment and add this
app.use('/api/users', userRoutes);
app.use('/api/case-queries', caseQueriesRoutes);
app.use('/api/random-cases', require('./Routes/randomCases'));
app.use('/api/stats', statsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/process-xray', processXrayRoutes);

// Add this line to serve uploaded files
app.use('/uploads', express.static('uploads'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Diagnosis API available at http://localhost:${PORT}/api/diagnosis`);
});