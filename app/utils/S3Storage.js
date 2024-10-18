const path = require('path');
const fs = require('fs/promises');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multerConfig = require('../../config/multer');
const mime = require('mime-types'); // Usando mime-types
const dotenv = require('dotenv');
console.log('Tentando carregar config.json');
const config = require('../../config.json');


const AWS_ACCESS_KEY_ID = config.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = config.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = config.AWS_REGION;

// Verificando se as variáveis de ambiente foram carregadas corretamente
console.log('dotenv loaded:', process.env.AWS_ACCESS_KEY_ID);
class S3Storage {
  constructor() {
    this.client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
      
      logger: console,
    });
  }

  async saveFile(filename) {
    const originalPath = path.resolve(multerConfig.directory, filename);
    
    // Usando mime-types para pegar o ContentType
    const ContentType = mime.lookup(originalPath);

    if (!ContentType) {
      throw new Error('File not found');
    }

    const fileContent = await fs.readFile(originalPath);

    try {
      await this.client.send(new PutObjectCommand({
        Bucket: 'profilepicusergastapouco',
        Key: filename,
        Body: fileContent,
        ContentType,
      }));
      console.log('Credenciais válidas!');
      console.log('Access Key:', process.env.AWS_ACCESS_KEY_ID);
      console.log('Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY);
      console.log('Region:', process.env.AWS_REGION);
    } catch (err) {
      console.error(err);
    }

    await fs.unlink(originalPath);
  }
}

console.log('Access Key:', process.env.AWS_ACCESS_KEY_ID);
console.log('Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('Region:', process.env.AWS_REGION);

module.exports = S3Storage;
