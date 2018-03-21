var express= require ("express");
var Campground = require ("../models/campground");
var User=require("../models/user");
const { cloudinary, upload } = require('../middleware/cloudinary');
var async = require("async");
var crypto = require("crypto");
const nodemailer = require('nodemailer');
var router=express.Router();
// express router


// Email Sendgrid
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey('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');

// INDEX 
router.get("/",function(req,res){	
	console.log(req.user);
	// ini mengambil data user
	Campground.find().sort({'createdAt': 'asc'}).exec(function(err,allcampgrounds){
	// kalau mau cari spesifik isi objectnya
	if(err){
		console.log(err);
	}else{
		User.find({},function(err,foundBiodata){
			res.render("campgrounds/index",{campgrounds:allcampgrounds, currentUser : req.user,biodata:foundBiodata})
		})
	}
})
	// res.render("campgrounds",{campgrounds:campgrounds})
})
router.get("/search",function(req,res){
	var search=req.body.search;
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground.find({ "name": regex }, function(err, foundCampgrounds) {
			if(err) {
				console.log(err);
			} else {
				res.render("campgrounds/index",{campgrounds:foundCampgrounds, currentUser:req.user});
			}
		}); 
	}else{
		res.redirect("/startup")
	}
})
// CREATE
router.post("/",isLoggedIn,upload.single('image'),function(req,res){
	if(req.file){
		cloudinary.uploader.upload(req.file.path,function(result){
			var name=req.body.name;
			var image=result.secure_url;
			var description=req.body.description;
			var author = {
				id: req.user._id,
				username : req.user.username,
				image : req.user.image
			}
			var newCampgrounds={name:name,image:image,description:description,author:author};
	// simpan ke database
	Campground.create(newCampgrounds),function(err,newCampground){
		if(err){
			console.log(err)
		}else{
			res.redirect("/startup")
			console.log(newCampground)
		}
	}
	res.redirect("/startup")
})
	}else{
		var name=req.body.name;
		var description=req.body.description;
		var author = {
			id: req.user._id,
			username : req.user.username,
			image : req.user.image
		}
		var newCampgrounds={name:name,description:description,author:author};
	// simpan ke database
	Campground.create(newCampgrounds),function(err,newCampground){
		if(err){
			console.log(err)
		}else{
			res.redirect("/startup")
			console.log(newCampground)
		}
	}
	res.redirect("/startup")
}
})
// new
router.get("/new",isLoggedIn,function(req,res){
	res.render("campgrounds/new");
})
// show
router.get("/:id",function(req,res){
	// kalau : digunakan untuk paramenter /isinya boleh apa saja
	console.log(req.params.id)
	// untuk membuat comment nya berisi
	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampgrounds){
		if(err){
			console.log(req.params.id);
			console.log(err);
		}else{
			console.log(foundCampgrounds)
			var commentCount = foundCampgrounds.comments.length;
			// console.log(commentCount);
			res.render("campgrounds/show",{campground:foundCampgrounds,commentCount:commentCount})
		}
	})
})

// EDIT ROUTES
router.get("/:id/edit",checkOwnership,function(req,res){
	// check if the user is logged in
	Campground.findById(req.params.id ,function(err,foundCampground){
		// tidak bisa pakai === karena satu object satu string
		res.render("campgrounds/edit",{campground : foundCampground});
	})
})
// UPDATE ROUTES
router.put("/:id",checkOwnership,upload.single('image'),function(req,res){
	if(req.file){
		cloudinary.uploader.upload(req.file.path,function(result){
			var name=req.body.name;
			var image=result.secure_url;
			var description=req.body.description;
			var author = {
				id: req.user._id,
				username : req.user.username,
				image : req.user.image
			}
			var updateCampgrounds={name:name,image:image,description:description,author:author};
			console.log(updateCampgrounds)
			Campground.findByIdAndUpdate(req.params.id,updateCampgrounds,function(err,updatedCampground){
				if(err){
					console.log(err);
					res.redirect("/startup");
				}else{
					res.redirect("/startup/"+req.params.id);
				}
			})
		})
	}else{
		Campground.findById(req.params.id,function(err,foundCampgrounds){
		if(err){
			console.log(req.params.id);
			console.log(err);
		}else{
		var name=req.body.name;
		var image=foundCampgrounds.image;
		var description=req.body.description;
		var author = {
			id: req.user._id,
			username : req.user.username,
			image : req.user.image
		}
		var updateCampgrounds={name:name,image:image,description:description,author:author};
		console.log(updateCampgrounds)
		Campground.findByIdAndUpdate(req.params.id,updateCampgrounds,function(err,updatedCampground){
			if(err){
				console.log(err);
				res.redirect("/startup");
			}else{
				res.redirect("/startup/"+req.params.id);
			}
		})
		}
	})

	}
})
// DELETE ROUTES
router.delete("/:id",checkOwnership,function(req,res){
	Campground.findByIdAndRemove(req.params.id,function(err){
		if(err){
			console.log(err);
			res.redirect("/startup");
		}else{
			req.flash("success","Delete Successfull!");
			res.redirect("/startup");
		}
	})
});
// EMAIL ROUTES
// router.get('/:id/done',(req,res)=>{
// 	const msg = {
//   to: 'robbytanrotan@gmail.com',
//   from: 'starvestindonesia@gmail.com',
//   subject: 'Sending with SendGrid is Fun',
//   text: 'and easy to do anywhere, even with Node.js',
//   html: '<strong>and easy to do anywhere, even with Node.js</strong>',
// };
// sgMail.send(msg);
// })
router.post("/:id/done",isLoggedIn,(req,res)=>{
	var bilangan = req.body.nominal;
	
	var	number_string = bilangan.toString(),
	sisa 	= number_string.length % 3,
	rupiah 	= number_string.substr(0, sisa),
	ribuan 	= number_string.substr(sisa).match(/\d{3}/g);

	if (ribuan) {
		separator = sisa ? '.' : '';
		rupiah += separator + ribuan.join('.');
	}

	Campground.findById(req.params.id,function(err,foundCampgrounds){
		if(err){
			console.log(req.params.id);
			console.log(err);
		}else{
			console.log(foundCampgrounds)
			// console.log(commentCount);
			let transporter = nodemailer.createTransport({
				service : 'gmail',
				secure : false,
				port : 25,
				auth : {
					user : 'starvestindonesia@gmail.com',
					pass : process.env.GMAILPW
				},
				tls : {
					rejectUnauthorized : false
				}
			});
			let HelperOptions = {
				from : '"Starvest" <starvestindonesia@gmail.com>',
				to : req.user.email,
				subject : 'TRANSACTION DETAILS',
				// html : '<table style="min-width: 320px; max-width: 600px;"><div><h1>TRANSAKSI ANDA</h1><h3>Total Pembayaran : Rp '+rupiah+' </h3><h3>Produk : '+foundCampgrounds.name+
				// '</h3><h3> Sertakan bukti pembayaran anda ke email ini<h3>Jika ada pertanyaan lebih lanjut anda dapat menanyakan nya ke email ini kembali</h3><h5><i>*Jangan percaya kepada'+
				// 'pesan trasaksi lain selain yang dikirimkan oleh email kami <em>starvestindonesia@gmail.com</em></i></h5></div></table>'
				html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width"><title>My Drip Email Template Subject</title></head><body style="-moz-box-sizing:border-box;-ms-text-size-adjust:100%;-webkit-box-sizing:border-box;-webkit-text-size-adjust:100%;Margin:0;background:#f3f3f3!important;box-sizing:border-box;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;min-width:100%;padding:0;text-align:left;width:100%!important"><style>@media only screen{html{min-height:100%;background:#f3f3f3}}@media only screen and (max-width:596px){.small-float-center{margin:0 auto!important;float:none!important;text-align:center!important}.small-text-center{text-align:center!important}.small-text-left{text-align:left!important}.small-text-right{text-align:right!important}}@media only screen and (max-width:596px){.hide-for-large{display:block!important;width:auto!important;overflow:visible!important;max-height:none!important;font-size:inherit!important;line-height:inherit!important}}@media only screen and (max-width:596px){table.body table.container .hide-for-large,table.body table.container .row.hide-for-large{display:table!important;width:100%!important}}@media only screen and (max-width:596px){table.body table.container .callout-inner.hide-for-large{display:table-cell!important;width:100%!important}}@media only screen and (max-width:596px){table.body table.container .show-for-large{display:none!important;width:0;mso-hide:all;overflow:hidden}}@media only screen and (max-width:596px){table.body img{width:auto;height:auto}table.body center{min-width:0!important}table.body .container{width:95%!important}table.body .column,table.body .columns{height:auto!important;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box;padding-left:16px!important;padding-right:16px!important}table.body .column .column,table.body .column .columns,table.body .columns .column,table.body .columns .columns{padding-left:0!important;padding-right:0!important}table.body .collapse .column,table.body .collapse .columns{padding-left:0!important;padding-right:0!important}td.small-1,th.small-1{display:inline-block!important;width:8.33333%!important}td.small-2,th.small-2{display:inline-block!important;width:16.66667%!important}td.small-3,th.small-3{display:inline-block!important;width:25%!important}td.small-4,th.small-4{display:inline-block!important;width:33.33333%!important}td.small-5,th.small-5{display:inline-block!important;width:41.66667%!important}td.small-6,th.small-6{display:inline-block!important;width:50%!important}td.small-7,th.small-7{display:inline-block!important;width:58.33333%!important}td.small-8,th.small-8{display:inline-block!important;width:66.66667%!important}td.small-9,th.small-9{display:inline-block!important;width:75%!important}td.small-10,th.small-10{display:inline-block!important;width:83.33333%!important}td.small-11,th.small-11{display:inline-block!important;width:91.66667%!important}td.small-12,th.small-12{display:inline-block!important;width:100%!important}.column td.small-12,.column th.small-12,.columns td.small-12,.columns th.small-12{display:block!important;width:100%!important}table.body td.small-offset-1,table.body th.small-offset-1{margin-left:8.33333%!important;Margin-left:8.33333%!important}table.body td.small-offset-2,table.body th.small-offset-2{margin-left:16.66667%!important;Margin-left:16.66667%!important}table.body td.small-offset-3,table.body th.small-offset-3{margin-left:25%!important;Margin-left:25%!important}table.body td.small-offset-4,table.body th.small-offset-4{margin-left:33.33333%!important;Margin-left:33.33333%!important}table.body td.small-offset-5,table.body th.small-offset-5{margin-left:41.66667%!important;Margin-left:41.66667%!important}table.body td.small-offset-6,table.body th.small-offset-6{margin-left:50%!important;Margin-left:50%!important}table.body td.small-offset-7,table.body th.small-offset-7{margin-left:58.33333%!important;Margin-left:58.33333%!important}table.body td.small-offset-8,table.body th.small-offset-8{margin-left:66.66667%!important;Margin-left:66.66667%!important}table.body td.small-offset-9,table.body th.small-offset-9{margin-left:75%!important;Margin-left:75%!important}table.body td.small-offset-10,table.body th.small-offset-10{margin-left:83.33333%!important;Margin-left:83.33333%!important}table.body td.small-offset-11,table.body th.small-offset-11{margin-left:91.66667%!important;Margin-left:91.66667%!important}table.body table.columns td.expander,table.body table.columns th.expander{display:none!important}table.body .right-text-pad,table.body .text-pad-right{padding-left:10px!important}table.body .left-text-pad,table.body .text-pad-left{padding-right:10px!important}table.menu{width:100%!important}table.menu td,table.menu th{width:auto!important;display:inline-block!important}table.menu.small-vertical td,table.menu.small-vertical th,table.menu.vertical td,table.menu.vertical th{display:block!important}table.menu[align=center]{width:auto!important}table.button.small-expand,table.button.small-expanded{width:100%!important}table.button.small-expand table,table.button.small-expanded table{width:100%}table.button.small-expand table a,table.button.small-expanded table a{text-align:center!important;width:100%!important;padding-left:0!important;padding-right:0!important}table.button.small-expand center,table.button.small-expanded center{min-width:0}}</style><span class="preheader" style="color:#f3f3f3;display:none!important;font-size:1px;line-height:1px;max-height:0;max-width:0;mso-hide:all!important;opacity:0;overflow:hidden;visibility:hidden"></span><table class="body" style="Margin:0;background:#f3f3f3!important;border-collapse:collapse;border-spacing:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;height:100%;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;width:100%"><tbody><tr style="padding:0;text-align:left;vertical-align:top"><td class="center" align="center" valign="top" style="-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;hyphens:auto;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word"><center data-parsed="" style="min-width:580px;width:100%"><table align="center" class="container body-drip float-center" style="Margin:0 auto;background:#fefefe;border-collapse:collapse;border-spacing:0;border-top:8px solid #639;float:none;margin:0 auto;padding:0;text-align:center;vertical-align:top;width:580px"><tbody><tr style="padding:0;text-align:left;vertical-align:top"><td style="-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;hyphens:auto;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word"><table class="spacer" style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%"><tbody><tr style="padding:0;text-align:left;vertical-align:top"><td height="16px" style="-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;hyphens:auto;line-height:16px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word"></td></tr></tbody></table><center data-parsed="" style="min-width:580px;width:100%"><img src="http://res.cloudinary.com/df9hhv4wy/image/upload/v1520765267/starvestwhite_oufccc.png" alt="" align="center" class="float-center" style="-ms-interpolation-mode:bicubic;Margin:0 auto;clear:both;display:block;float:none;margin:0 auto;max-height:200px;max-width:100%;outline:0;text-align:center;text-decoration:none;width:auto"></center><table class="spacer" style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%"><tbody><tr style="padding:0;text-align:left;vertical-align:top"><td height="16px" style="-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;hyphens:auto;line-height:16px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word"></td></tr></tbody></table><table class="row" style="border-collapse:collapse;border-spacing:0;display:table;padding:0;position:relative;text-align:left;vertical-align:top;width:100%"><tbody><tr style="padding:0;text-align:left;vertical-align:top"><th class="small-12 large-12 columns first last" style="Margin:0 auto;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:16px;padding-left:16px;padding-right:16px;text-align:left;width:564px"><table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%"><tbody><tr style="padding:0;text-align:left;vertical-align:top"><th style="Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left"><h4 class="text-center" style="Margin:0;Margin-bottom:10px;color:inherit;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center;word-wrap:normal">TRANSACTION DATA</h4><h5 class="text-center" style="Margin:0;Margin-bottom:10px;color:inherit;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center;word-wrap:normal">Total Price : Rp '+rupiah+'</h5><h5 class="text-center" style="Margin:0;Margin-bottom:10px;color:inherit;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center;word-wrap:normal">Product : '+foundCampgrounds.name+'</h5><h5 style="Margin:0;Margin-bottom:10px;color:inherit;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left;word-wrap:normal">Silahkan transfer ke rekening berikut : (BCA) 8075206921</h5><h5 class="text-center" style="Margin:0;Margin-bottom:10px;color:inherit;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center;word-wrap:normal">Sertakan bukti pembayaran anda ke email ini</h5></th><th class="expander" style="Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;visibility:hidden;width:0"></th></tr></tbody></table></th></tr></tbody></table><hr><table class="row" style="border-collapse:collapse;border-spacing:0;display:table;padding:0;position:relative;text-align:left;vertical-align:top;width:100%"><tbody><tr style="padding:0;text-align:left;vertical-align:top"><th class="small-12 large-12 columns first last" style="Margin:0 auto;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:16px;padding-left:16px;padding-right:16px;text-align:left;width:564px"><table style="border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%"><tbody><tr style="padding:0;text-align:left;vertical-align:top"><th style="Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left"><h6 style="Margin:0;Margin-bottom:10px;color:inherit;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left;word-wrap:normal">Jika ada pertanyaan lebih lanjut anda dapat menanyakan nya ke email ini kembali</h6><h6 style="Margin:0;Margin-bottom:10px;color:inherit;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:left;word-wrap:normal"><i>*Jangan percaya kepada pesan trasaksi lain selain yang dikirimkan oleh email kami <em>starvestindonesia@gmail.com</em></i></h6></th><th class="expander" style="Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;visibility:hidden;width:0"></th></tr></tbody></table></th></tr></tbody></table><div style="display:none;white-space:nowrap;font:15px courier;line-height:0">&amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp; &amp;nbsp;</div></td></tr></tbody></table></center></td></tr></tbody></table></body></html>'
			}
			transporter.sendMail(HelperOptions, (error,info)=>{
				if(error){
					return console.log(error);
				}
				console.log("The message was sent");
				req.flash("success","An email has been sent to you with further instructions ");
				res.redirect('/startup')
			})
		}
	})

})
// middleware
function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","Please Login First");
	res.redirect("/login");
}
function checkOwnership(req,res,next){
		// check if the user is logged in
		if(req.isAuthenticated()){
			Campground.findById(req.params.id ,function(err,foundCampground){
				if(err){
					res.redirect("back");
				}else{
				// is the user own the campgrounds?
				if(foundCampground.author.id.equals(req.user._id) || req.user._id.equals("5aa4b7d422d21c37881b241d")){
					// tidak bisa pakai === karena satu object satu string
					next();
				}else{
					res.redirect("back");
				}
			}
		})
		}else{
			res.redirect("/login");
		}
	}
	function escapeRegex(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	};

	module.exports= router;