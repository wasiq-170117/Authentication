//jshint esversion:6
require("dotenv").config();
const express = require ('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
//const encrypt = require('mongoose-encryption');
//const md5 = require('md5');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static("public"));

app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({
    extended: true
}));

const userschema = new mongoose.Schema({
    email: String,
    password: String
});

//userschema.plugin(encrypt, {secret: process.env.SECRETKEY, encryptedFields: ["password"]}); 

const User = mongoose.model("User", userschema);

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/userDb");

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    

    //bcrypt Technique (Level 4) //
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        
        const newUser = new User({
            email: req.body.username,
            password: hash
        });

        newUser.save(function(err) {    
            
            if(err)
            {
                    console.log(err);
            }
            else {
                console.log('user successfully registered');
                res.render("secrets");
            }
        });
    })
    //bcrypt Technique (Level 4) //

    // newUser.save(function(err) {
    //     if(err)
    //     {
    //         console.log(err);
    //     }
    //     else {
    //         console.log('user successfully registered');
    //         res.render("secrets");
    //     }
    // });
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", function(req, res) {
    User.findOne({
        email: req.body.username
    }, function(err,foundUser) {
        if (err) {
            console.log(err);
        }

        else {
            if (foundUser)
            {
                bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                    if (result === true)
                    {
                        res.render("secrets");
                    }
                });
                
            }
        }
    })
})


app.listen(3000, function() {
    console.log('Server started at port 3000');
});