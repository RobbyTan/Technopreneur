var express	 		  = require("express"),
app	      			  = express(),
bodyParser 			  = require("body-parser"),
passport  			  = require("passport"),
LocalStrategy         = require("passport-local"),
passportLocalMongoose = require("passport-local-mongoose"),
methodOverride   	  = require("method-override"),
mongoose   			  = require('mongoose')
User				  = require("./models/user");
mongoose.Promise = global.Promise; 
var url ="mongodb://localhost/starvest"
mongoose.connect(url,{useMongoClient: true});

app.use(require("express-session")({
	secret : "Robby is the best",
	resave : false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(methodOverride("_method"));
app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	next();
	// untuk memberikan akses current User ke semua
});
var indexRoutes=require("./routes/index");

app.use(indexRoutes);

app.listen(process.env.PORT || 3000,function(){
	console.log("Server has started")
})