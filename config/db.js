const mongoose = require('mongoose');
const db = process.env.MONGO_URI;


const connectDB = async () => {
  console.log(db);
  try {
    await mongoose.connect(db);
  console.log('mongobd connected');
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
}


module.exports = connectDB;