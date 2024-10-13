var express = require("express");
var router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.JWT_TOKEN;
const withAuth = require('../middlewares/auth')
const bcrypt = require('bcrypt');

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

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


router.put("/", withAuth, async function (req, res) {
  const { name, email, password } = req.body;
  
  try {
    var user = await User.findOne({ _id: req.user._id });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if (password) {
      //const hashedPassword = await bcrypt.hash(password, 10);
      user.password = password;
    }
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: error.message });
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

module.exports = router;
