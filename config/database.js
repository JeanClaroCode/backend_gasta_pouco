const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://0.0.0.0:27017/backend', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connection successful'))
.catch(err => console.error('Connection error:', err));
