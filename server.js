if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express  = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const app  = express();
const passport  = require('passport');
const initializePassport = require('./passportConfig');
const flash = require('express-flash');
const session = require('express-session');
const override =require('method-override');


initializePassport(
    passport,
    email => users.find(user => { return user.email === email
    }),
    id => users.find(user => user.id === id)
)

const users = []

app.set('view-engine', 'ejs')
app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(flash());
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize())
app.use(passport.session())
app.use(override('_method'))



// connetion to the data base
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "alterna"
});

db.connect(function(err) {
    if (err) throw err;
    // db.query("SELECT `id`, `name`, `email`, `password` FROM `clients` WHERE 1", function (err, result) {
    //     if (err) throw err;
    //     result.map(user => {
    //         users.push(user)
    //     })
    //     console.log(users);
    // });
    console.log("Connecté à la base de données MySQL!");

});







// routing 
app.get('/', checkAuth, (req, res) => {       
    res.render('index.ejs', { name: req.user.name })
});
app.get('/login', checkNoAuth, (req, res) => {       
    res.render('login.ejs')
});

app.post('/login', checkNoAuth , passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNoAuth ,(req, res) => {       
    res.render('register.ejs')
});

app.post('/register', checkNoAuth, async (req, res) => {     
    const Hpassword = await bcrypt.hash(req.body.password, 10)
    try {
        const user ={ 
            id: Date.now().toString(),
            name: req.body.name, 
            password: Hpassword,
            email: req.body.email 
        }
        db.query("INSERT INTO `clients`(`name`, `email`, `password`) VALUES ('"+user.name+"', '"+user.email+"', '"+user.password+"')", function (err, result) {
            if (err) throw err;
            console.log(result);
        });
        users.push(user);
        res.redirect('/login')
    } catch (error) {
        res.redirect('/register')
    }
    console.log(users)
});

app.delete('/logout', (req,res) => {
    req.logOut()
    res.redirect('/login')
})


// check the authenticated user 
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

// check the no authenticated user
function checkNoAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}




app.listen(5000, () => {           
    console.log(`Now starting with port 5000`); 
});