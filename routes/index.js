var express= require ("express");
var passport=require("passport");
var User=require("../models/user");
var router=express.Router();

router.get("/",function(req,res){
	res.redirect("/login");
})
router.get("/home",function(req,res){
	res.render("home");
});
router.get("/login",function(req,res){
	res.render("login");
})
router.post("/login",passport.authenticate("local",{
	successRedirect : "/home",
	failureRedirect : "/login",
}),function(req,res){

})
router.get("/register",function(req,res){
	res.render("register");
})
router.post("/register",function(req,res){
	var password=req.body.password;
	var confirmPassword= req.body.confirmpassword;
	var newUser = new User({username:req.body.username,image:"",email:req.body.email,birthday:req.body.birthday,gender:req.body.gender});
	if(password==confirmPassword){
		User.register(newUser,req.body.password,function(err,user){
			if(err){
				console.log(err);
				return res.redirect("/register");
			}
			passport.authenticate("local")(req,res,function(){
				console.log(req.body.image);
				res.send("Welcome");
			});
		});
	}else{
		res.redirect("/register")
	}
})
module.exports= router;