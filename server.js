const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/utils/db');
const User = require('./src/models/user.model');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB and create default admin
const initializeServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@powerev.com' });

    if (!adminExists) {
      // Create default admin user
      await User.create({
        name: 'Admin',
        email: 'admin@powerev.com',
        password: '123456',
        role: 'admin',
      });
      console.log('✅ Default admin user created');
      console.log('📧 Email: admin@powerev.com');
      console.log('🔑 Password: 123456');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Server initialization error:', error.message);
  }
};

initializeServer();

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const chargerRoutes = require('./src/routes/charger.routes');
const cableRoutes = require('./src/routes/cable.routes');
const stationRoutes = require('./src/routes/station.routes');
const adapterRoutes = require('./src/routes/adapter.routes');
const boxRoutes = require('./src/routes/box.routes');
const breakerRoutes = require('./src/routes/breaker.routes');
const plugRoutes = require('./src/routes/plug.routes');
const wireRoutes = require('./src/routes/wire.routes');
const otherRoutes = require('./src/routes/other.routes');
const cartRoutes = require('./src/routes/cart.routes');
const orderRoutes = require('./src/routes/order.routes');

// Test route
app.get('/', (req, res) => {
  res.send('PowerEV API is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/cables', cableRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/adapters', adapterRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/breakers', breakerRoutes);
app.use('/api/plugs', plugRoutes);
app.use('/api/wires', wireRoutes);
app.use('/api/others', otherRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));