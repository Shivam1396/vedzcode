require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/mess', require('./routes/messRoutes'));
app.use('/api/meals', require('./routes/mealRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 3000, () => console.log('Canteen running on :' + (process.env.PORT || 3000))))
  .catch(e => console.error('DB error', e.message));