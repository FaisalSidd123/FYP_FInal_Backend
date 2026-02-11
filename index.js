const express = require('express');
const cors = require('cors');
const diagnosisRoutes = require('./Routes/diagnosis'); // ✅ Add this
const userRoutes = require('./Routes/users');

const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/diagnosis', diagnosisRoutes); // ✅ Uncomment and add this
app.use('/api/users', userRoutes);

// Add this line to serve uploaded files
app.use('/uploads', express.static('uploads'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Diagnosis API available at http://localhost:${PORT}/api/diagnosis`);
});