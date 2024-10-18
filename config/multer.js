const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const tmpFolder = path.resolve(__dirname, "..", 'tmp' );

const multerConfig =  {
    directory: tmpFolder,
    storage: multer.diskStorage({
        destination: tmpFolder,
        filename: (request, file, callback) => {
            const fileHash = crypto.randomBytes(10).toString('hex');
            const filename = `${fileHash}-${file.originalname}`;
            return callback(null, filename);

        } 
    }),
}

module.exports = multerConfig; // Certifique-se de que o multerConfig está sendo exportado como objeto
