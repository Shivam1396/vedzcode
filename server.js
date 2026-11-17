require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), path = require('path');
const Meal = require('./models/Meal'), Mess = require('./models/Mess');

// ---------- Auto-seed data (same as seed.js) ----------
const MESSES = [
  ['Raj Mess', 'VEGTHALI.jpeg'], ['Sofa Mess', 'dal khichdi.jpeg'], ['Annapurna Mess', 'masala dosa.jpeg'],
  ['Shivam Mess', 'VEGBRIYANI.jpeg'], ['Sai Mess', 'PANEERMASAL.jpeg'], ['Gokul Mess', 'pav bhaji.jpeg'],
  ['Krishna Mess', 'chole bhature.jpeg'], ['Ganesh Mess', 'hakka noodles.jpeg'],
  ['Laxmi Mess', 'rajma chawal.jpeg'], ['Om Mess', 'idli.jpeg']
];
const m = (c, rows) => rows.map(([slug, name, price, image]) => ({ slug, name, price, image, category: c }));
const MENU = [
  ...m('breakfast', [['poha','Poha',25,'poha.jpeg'],['idli-sambar','Idli Sambar',35,'idli.jpeg'],['masala-dosa','Masala Dosa',50,'masala dosa.jpeg'],['upma','Upma',25,'upma.jpeg'],['aloo-paratha','Aloo Paratha',45,'aloo paratha.jpeg'],['misal-pav','Misal Pav',50,'misal pav.jpeg'],['masala-chai','Masala Chai',12,'chai.jpeg']]),
  ...m('lunch', [['veg-thali','Veg Thali',90,'VEGTHALI.jpeg'],['paneer-masala','Paneer Masala',110,'PANEERMASAL.jpeg'],['veg-biryani','Veg Biryani',85,'VEGBRIYANI.jpeg'],['chole-bhature','Chole Bhature',75,'chole bhature.jpeg'],['rajma-chawal','Rajma Chawal',70,'rajma chawal.jpeg'],['dal-khichdi','Dal Khichdi',70,'dal khichdi.jpeg'],['buttermilk','Buttermilk',15,'buttermilk.jpeg']]),
  ...m('dinner', [['dal-tadka-rice','Dal Tadka Rice',80,'dal_tadka.jpg'],['paneer-butter-masala','Paneer Butter Masala',120,'PANEERMASAL.jpeg'],['pav-bhaji','Pav Bhaji',70,'pav bhaji.jpeg'],['veg-fried-rice','Veg Fried Rice',70,'vegfriedrice.jpeg'],['hakka-noodles','Hakka Noodles',70,'hakka noodles.jpeg'],['gulab-jamun','Gulab Jamun',30,'Gulab Jamun.jpg'],['cold-coffee','Cold Coffee',45,'COLDCOFEE.jpeg']])
];

// Inserts the starting data ONLY if there are no messes yet. Safe to run on every start.
let seeding;
function seedIfEmpty() {
  if (!seeding) {
    seeding = (async () => {
      if (await Mess.countDocuments() > 0) return;
      console.log('Database empty, seeding...');
      await Meal.syncIndexes();
      const messes = await Mess.insertMany(MESSES.map(([name, image]) => ({ name, image })));
      const all = messes.flatMap(ms => MENU.map(d => ({ ...d, mess: ms._id })));
      await Meal.insertMany(all);
      console.log('Seeded', messes.length, 'messes and', all.length, 'dishes');
    })().catch(e => { seeding = null; console.error('Seed error', e.message); });
  }
  return seeding;
}

const app = express();

// Connect to the database (cached, so it also works on Vercel)
let connecting;
function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('DB connected'))
      .then(seedIfEmpty)   // auto-fills messes and menu the first time (only if empty)
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
