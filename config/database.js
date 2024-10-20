const mongoose = require('mongoose');
require('dotenv').config();

mongoose.Promise = global.Promise;

const MONGO_URL = `mongodb+srv://jeanclarodev:${process.env.MONGO_PASSWORD}@gastapoucodb2.ohocl.mongodb.net/?retryWrites=true&w=majority&appName=gastapoucodb2`;

if (!process.env.MONGO_PASSWORD) {
    console.error('MONGO_PASSWORD is not defined');
}

mongoose.connect(MONGO_URL, {
    //useNewUrlParser: true,
    //useUnifiedTopology: true
})
.then(() => console.log('Connection successful'))
.catch(err => console.error('Connection error:', err));
