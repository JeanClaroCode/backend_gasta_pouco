var express = require("express");
var router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.JWT_TOKEN;
const withAuth = require('../middlewares/auth')
const bcrypt = require('bcrypt');
const UploadImagesService = require('../services/UploadImagesService');
const multer = require('multer');
const multerConfig = require('../../config/multer');


const upload = multer(multerConfig)

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
}

  try {
    const user = new User({ name, email, password });
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Error registering new user" });
  }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    
    try {
      let user = await User.findOne({email})
        if(!user) res.status(401).json({error: "Incorrect email or password"})
          else{
            user.isCorrectPassword(password, function (err, same) { 
              if(!same)
                  res.status(401).json({error: "Incorrect email or password"})
              else{
                const token = jwt.sign({email}, secret, { expiresIn: "10d"});
                res.json({user: user, token: token})
          }
      })
    }
    } catch (error) {
      res.status(500).json({error: "Internal error, please try again"})
    }

})


router.put("/:id", withAuth, async function (req, res) {
  const { name, email, password, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id); 
    console.log(`AAAAAAAAAA: ${user}`)
    if (!user) {
      return res.status(404).json({ error: "User  not found" });
    }

    // Atualiza o nome e o e-mail se fornecidos
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }

    // Verifica se a senha atual foi fornecida
    if (password) {
      console.log(`senha: ${password}`)
      // Compara a senha fornecida com a senha hasheada armazenada
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Se a senha atual estiver correta, atualiza a senha para a nova
      if (newPassword) {
        user.password = newPassword
        console.log(`nova senha: ${user.password}`) // Hash da nova senha
      }
    }

    await user.save();

    // Retorna o usuário sem a senha
    const userResponse = user.toObject();
    delete userResponse.password; // Remove a senha do objeto de resposta

    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/delete", withAuth, async (req, res) => { 
    try {
      let user = await User.findOne({_id: req.user._id});
      await user.deleteOne()
      res.json({message: "Ok"}).status(201)
    } catch (error) {
      res.status(500).json({error: error})
    }
})

router.post('/img/:id', withAuth, upload.single('image'), async (req, res) => {
  const uploadImagesService = new UploadImagesService();
  const userId = req.params.id;

  try {
    await uploadImagesService.execute(req.file); 
    const s3BucketUrl = `https://profilepicusergastapouco.s3.amazonaws.com/${req.file.filename}`
    const updatedUser  = await User.findByIdAndUpdate(userId, {
      profilePictureUrl: s3BucketUrl
    }, { new: true }); // Adicionando { new: true } para retornar o usuário atualizado

    if (!updatedUser ) {
      return res.status(404).send({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Profile picture uploaded successfully!', url: s3BucketUrl });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

module.exports = router;
