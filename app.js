var express           = require("express"),
    app               = express(),
    bodyParser        = require("body-parser"),
    mongoose          = require("mongoose"),
    methodOverride    = require("method-override"),
    User              = require("./models/user"),
    LocalStrategy     = require("passport-local"),
    passport          = require("passport"),
    Medication        = require("./models/medication")

mongoose.connect("mongodb://localhost/medication_adherence_app");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));


// Passport Configuration
app.use(require("express-session")({
	secret: "med-app",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// middleware for current User
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
})



// Restful Routes


app.get("/", isLoggedIn, function(req, res){
	res.render("index");
});


app.get("/users", function(req, res){
	User.find({}, function(err, user){
		if(err){
			console.log(err);
		} else {
			res.render("users", {user: user})
		}
	});
});


// NEW - show form to create new medication entry
app.get("/new", isLoggedIn, function(req, res){
	res.render("new");
});


// SHOW 
app.get("/medication-list", function(req, res){
	Medication.find({}, function(err, medication){
		if(err){
			console.log(err);
		} else{
			res.render("medication-list", {medication: medication});
		}
	});
});


app.post("/medication-list", function(req, res){
	var medicationName = req.body.medicationName;
	var date = req.body.date;
	var desc = req.body.desc;
	var newMed = {medicationName: medicationName, date: date, desc: desc};

	Medication.create(newMed, function(err, newlyMed){
		if(err){
			console.log(err);
		} else {
			res.redirect("/medication-list");
		}
	});
});

// app.post("/medication-list", function(req, res){
// 	// find campground with provided id
// 	Medication.findById(req.params.id).populate("medicationName").exec(function(err, foundMedication){
// 		if(err){
// 			console.log(err);
// 		} else {
// 			// render show template
// 			console.log(foundMedication);
// 			res.render("/medication-list", {medication: foundMedication});
// 		}	
// 	});
// });


// Auth Routes
app.get("/register", function(req, res){
	res.render("register");
});


app.post("/register", function(req, res){
	var newUser = new User({
		name: req.body.name,
		username: req.body.username,
		image: req.body.image,
		email: req.body.email,
		password: req.body.password,
    	passwordConf: req.body.passwordConf
	});

	User.register(newUser, req.body.password, function(err, user){
		if(err) {
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("/");
		});
	});
});


app.get("/login", function(req, res){
	res.render("login");
});


app.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/",
		failureRedirect: "/login"
	}), function(req, res) {
});


app.get("/logout", function(req, res){
	req.logout();
	console.log("logged out!");
	res.redirect("/login");
});


function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}

	res.redirect("/login");
}



app.listen(3000, function(){
	console.log("App is running!");
});
