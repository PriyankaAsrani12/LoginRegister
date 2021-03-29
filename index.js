var express = require("express")
var app = express()
var passport = require("passport")
var bodyParser = require("body-parser")
var mysql = require("mysql")
var session = require("express-session")
var flash = require("connect-flash")
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(flash())
app.use(session({
    secret: "Priyanka",
    resave: false,
    saveUninitialized: false,
}));
//==============================================
//MYSQL CONNECTION
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "demo",
});
connection.connect(function(err) {
    if (err) {
        console.log("Error in connection!")
    } else {
        console.log("Connected with MySQL!")
    }
});

//==============================================
//SERIALIZING AND DESERILIZING
passport.serializeUser(function(username, done) {
    done(null, username.id);
});

passport.deserializeUser(function(id, done) {
    connection.query("select * from auth where id = " + id, function(err, rows) {
        done(err, rows[0]);
    });
});
app.use(passport.initialize());
app.use(passport.session());



app.get("/", function(req, res) {
    res.redirect('/login')
});

//SIGNUP ROUTE
app.get("/register", function(req, res) {
    res.render("register", { message: req.flash("error") })
});
app.post("/register", function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    if (username == "" && password == "") {
        req.flash("error", "Username and password cannot be empty!")
        res.redirect("/register")
    } else {
        connection.query("SELECT * FROM auth WHERE username=? AND password=?", [username, password], function(error, rows, field) {
            if (error) {
                console.log("Error")
                console.log(error)
            } else if (rows.length == 0) {
                connection.query("INSERT INTO auth(username,password) VALUES(?,?)", [username, password], function(error, rows, field) {
                    if (error) {
                        console.log("Error in inserting to database")
                        console.log(error)
                    } else {
                        passport.authenticate("local")(req, res, function() {
                            console.log("Successfull!")
                            req.flash("success", "Successfully registered user as " + username)
                            res.redirect('/login');
                        })
                    }
                })
            } else {
                console.log("User already exist!")
                res.redirect("/register")
            }
        });
    }
});

//==============================================
//LOGIN
app.get("/login", function(req, res) {
    res.render("login", { message: req.flash("error"), mess: req.flash("success") })
})

app.post("/login", function(req, res) {
    var id = req.params.id
    var user = req.body.username
    var password = req.body.password
    if (user == "" && password == "") {
        req.flash("error", "Username and password cannot be empty!")
        res.redirect("/login")
    } else {
        connection.query("SELECT * FROM auth WHERE username=?", [user], function(error, rows, field) {
            if (error) {
                console.log("ERROR")
            } else {
                if (rows.length == 0) {
                    console.log("No user found")
                    req.flash("error", "Opps! No user found")
                    res.redirect("/login")
                } else {
                    if (rows[0]["password"] != password) {
                        console.log("Opps Wrong password")
                        req.flash("error", "Opps! Wrong password")
                        res.redirect("/login")
                    } else {
                        passport.authenticate("local")(req, res, function() {
                            console.log("Successfull!")
                            connection.query("UPDATE auth SET status='login' WHERE username=?", [user], function(error, rows, field) {
                                if (error) {
                                    console.log("ERROR")
                                } else {
                                    console.log("Success!")
                                }
                            })
                            req.flash("success", "Successfully logged in as " + user)
                            res.redirect("/campgrounds");
                        })
                    }
                }
            }
        });
    }
});
app.get("/campgrounds", function(req, res) {
    // Get all the campgrounds from the DB
    connection.query("SELECT * FROM auth WHERE status='login'", function(err) {
        if (err) {
            console.log("ERROR in retrieving from DB")
        } else {
           res.render("campgrounds", { mess: req.flash("success") }) 
        }
    });
});

//==============================================
//LOGOUT ROUTE
app.get("/logout", function(req, res) {
    req.logout();
    connection.query("UPDATE auth SET status='logout'", function(error, rows, field) {
        if (error) {
            console.log("ERROR")
        } else {
            console.log("Successfully logged out!")
            req.flash("success", "Successfully, logged you out!")
            res.redirect("/")
        }
    });
});

//==============================================
//SERVER LISTENING
app.listen(5000,function() {
    console.log("Server Started")
});