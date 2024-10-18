const S3Storage = require('../utils/S3Storage');

class UploadImagesService {
    async execute(file) {
        if (!file) {
            throw new Error('Nenhuma imagem foi carregada');
        }
        const s3Storage = new S3Storage();
        await s3Storage.saveFile(file.filename)
    }
}

module.exports = UploadImagesService;


