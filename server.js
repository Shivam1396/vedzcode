require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), path = require('path');
const app = express();

// Connect to the database (cached, so it also works on Vercel)
let connecting;
function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('DB connected'))
      .catch(e => { connecting = null; console.error('DB error', e.message); });
  }
  return connecting;
}

app.use(express.json());

// Make sure the database is connected before any request is handled
app.use(async (req, res, next) => { await connectDB(); next(); });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/mess', require('./routes/messRoutes'));
app.use('/api/meals', require('./routes/mealRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Vercel uses the exported app
module.exports = app;

// Local computer and Render: start the server normally
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  connectDB().then(() => app.listen(PORT, () => console.log('Canteen running on :' + PORT)));
}
