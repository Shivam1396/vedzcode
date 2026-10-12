require('dotenv').config();
const mongoose = require('mongoose'), Meal = require('./models/Meal'), Mess = require('./models/Mess');

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

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Meal.deleteMany({}); await Mess.deleteMany({});
  await Meal.syncIndexes(); // drops the old "slug only" unique index
  const messes = await Mess.insertMany(MESSES.map(([name, image]) => ({ name, image })));
  const all = messes.flatMap(ms => MENU.map(d => ({ ...d, mess: ms._id })));
  await Meal.insertMany(all);
  console.log('Seeded', messes.length, 'messes and', all.length, 'dishes');
  process.exit();
});