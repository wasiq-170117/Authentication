//jshint esversion:6
require("dotenv").config();
const express = require ('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



//const encrypt = require('mongoose-encryption');
//const md5 = require('md5');

// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));



app.use(session({
  secret: 'Our Little Secret',
  resave: false,
  saveUninitialized: false,
  //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());
const userschema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);


//userschema.plugin(encrypt, {secret: process.env.SECRETKEY, encryptedFields: ["password"]}); 

const User = mongoose.model("User", userschema);

passport.use(User.createStrategy());

//Used for passport-local-mongoose//
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//Used for passport-local-mongoose//

//Used for and Local Strategies//
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    })
});
//Used for and Local Strategies//
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log('profile = ', profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/userDb");

app.get("/", function(req, res) {
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect Secrets.
    res.redirect('/secrets');
  });

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/logout", function(req, res) {
    req.logout(function(err) {
        if (err)
        {
            console.log(err);
        }

        else {
            res.clearCookie('connect.sid', {path: '/'});
            req.session.destroy(function(err) {
                res.redirect("/");
            });
        }
    })
})

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated())
    {
        res.render("secrets");
    }

    else {
        res.redirect("/login");
    }
})

app.post("/register", function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err)
        {
            console.log(err);
        }

        else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    })
});

// app.post("/register", function(req, res) {
    
//     //bcrypt Technique (Level 4) //
//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         });

//         newUser.save(function(err) {    
            
//             if(err)
//             {
//                     console.log(err);
//             }
//             else {
//                 console.log('user successfully registered');
//                 res.render("secrets");
//             }
//         });
//     })
//     //bcrypt Technique (Level 4) //

//     // newUser.save(function(err) {
//     //     if(err)
//     //     {
//     //         console.log(err);
//     //     }
//     //     else {
//     //         console.log('user successfully registered');
//     //         res.render("secrets");
//     //     }
//     // });
// });

app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err)
        {
            console.log(err);
        }

        else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });
    
});

// app.post("/login", function(req, res) {
//     User.findOne({
//         email: req.body.username
//     }, function(err,foundUser) {
//         if (err) {
//             console.log(err);
//         }

//         else {
//             if (foundUser)
//             {
//                 bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
//                     if (result === true)
//                     {
//                         res.render("secrets");
//                     }
//                 });
                
//             }
//         }
//     })
// });


app.listen(3000, function() {
    console.log('Server started at port 3000');
});