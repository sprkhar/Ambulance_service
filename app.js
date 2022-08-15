var express = require("express");//web app framework used for node.js
var app = express();//varaible for using express 
var bodyparser=require("body-parser");//body-parser extracts the entire body portion of an incoming request stream and exposes it on req.body.
var mongoose= require("mongoose");//ok
var passport=require("passport");//ok
var localStrategy=require("passport-local");//ok
var passportLocalMongoose = require("passport-local-mongoose");//
var methodOverride=require("method-override");
var flash=require("connect-flash");//ok
var async=require("async");//
var nodemailer=require("nodemailer");//for sending mails 
var smtpTransport = require('nodemailer-smtp-transport');//SMTP is the main transport in Nodemailer for delivering messages
var crypto=require("crypto");//used for hashing the crypto module provides a way of handling encrypted data.
//also used twilio library


var User=require("./models/user");//variable of schema user type(like a object of schema user)
var Feedback = require("./models/feedback");//variable of schema feedback type(like a object of schema feeback)
var Ambulance = require("./models/ambulance");//variable of schema Ambulance type(like a object of Ambulance user)
var List = require("./models/bookinglist");//variable of schema bookingList type(like a object of bookingList user)

var active = 0;//tells the active status of ambulance
var i=0;//for count the no of total ambulance
var admin=0;//varying if admin is there or not

//a middleware to create and manage a new session //https://stackoverflow.com/questions/40381401/when-to-use-saveuninitialized-and-resave-in-express-session
app.use(require("express-session")({
    secret:"adventure28",//a key used for signing and/or encrypting cookies set by the application to maintain session state,setting secert hashes the session
    resave:false,//It basically means that for every request to the server, it reset the session cookie
    saveUninitialized:false//the (still empty, because unmodified) session object will not be stored in the session store.
}));

app.set("view engine","ejs");//tells to set view engine as Ejs
app.use(express.static(__dirname+"/public"));//saving the path directory
app.use(bodyparser.urlencoded({extended:true}));//body-parser is an NPM package that parses incoming request bodies in a middleware before your handlers, available under the req.body property.//middleware for parsing bodies from URL
app.use(methodOverride("_method"));//Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn’t support it.
app.use(flash());//to use flash library to flash message(notifaction type).
mongoose.connect("mongodb://localhost:27017/test");//to connect server to database.

//setting up passport for auth //https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
app.use(passport.initialize());//intilazing passport
app.use(passport.session());//connecting passport with session
passport.use(new localStrategy(User.authenticate()));//telling passport to user localauth statery on user 
passport.serializeUser(User.serializeUser());// function to persist user data (after successful authentication) into session(determines which data of the user object should be stored in the session)
passport.deserializeUser(User.deserializeUser());//used to retrieve user data from session(which was serlized by passport)

app.use(function(req,res,next){//to put localusers as currentuser
  res.locals.currentUser=req.user;
  // res.locals.error=req.flash("error");
  // res.locals.success=req.flash("success");
  next();//to carrryforward
});

//router to main landing page
app.get("/",function(req,res){
  res.render("landing",{page:'landing'}); 
});

//router that takes you to user login page
app.get("/userlogin",function(req,res){
  res.render("userlogin");
});

//router that takes you to admin login page
app.get("/adminlogin",function(req,res){
  res.render("adminlogin");
});

//when you are not register or not signed up user then you press signup button 
//when you fill that user signup form and press on signup then this router creates a new user schema and 
//fill the info in that. 
app.post("/userregister",function(req, res) {
    console.log("reg");
    var newUser=new User({//newuser in schema of user 
        username:req.body.username,//filling username field
        mobile:req.body.mobile,//filling mobile info
        full_name:req.body.fullname,//filling fullname info
    });
    //register the new user  by its username and password provided by user
    //if there is any error then redirects to user login page again
    User.register(newUser,req.body.password,function(err,user){
        if(err){
            console.log(err);
              // req.flash("error",err.message);
            return res.redirect("/userlogin");//if error i
        }
        //else redirects to userhomepage and flash a message of welcome 
        passport.authenticate("local")(req,res,function(){
              // req.flash("success","Welcome To QnAHub Mr."+user.username);
            console.log(user);
            res.redirect("/mainpage"); 
        });
    });
});

//when user trying to login from user login page through
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/mainpage",//if username and password matches then redirects to user homepage
        failureRedirect: "/userlogin"//else redirects to userlogin page again
    }) , function(req, res){
});

//to check if the username entered by user exist in the database
app.get("/mainpage",function(req, res) {
    var user=req.user ||null;//if username is provided then intilazing it by provided username else with NULL
    //if no username is provided then it redirects user to userloginpage
    if(user==null){
        res.redirect("/userlogin");//redirecting user to loginpage
    }
    //if username is provided then it redirects user to its usermainpage
    else{
     res.render("mainpage");//redirecting user to mainpage
    }
});

//username and password for admin will be provided by hospital so no signup option only login option
//getting username and password from user and checking it
app.post("/adminlogin",function(req, res) {
   if(req.body.username=='admin1234' && req.body.password=='admin1234'){
       admin=1;//intinalzing admin to symbolozing you are admin and logged in
       res.redirect("/adminhome");//if username and password matches redirecting admin to its mainpage
   } 
   else{
       res.redirect("/adminlogin");//if doesnt match redirecting admin admin login page again
   }
});

//for admin homepage
app.get("/adminhome",function(req, res) {
    //admin=1 symbolozie that you are logined as admin so it you will acts as admin
    if(admin==1){//if you are admin 
        Ambulance.find({},function(err,ambulances){//for findining ambulance in database
       if(err){
           console.log("er1");
           console.log(err);
           res.redirect("/adminlogin");//if error occured redirect to admin login page
       } 
       else{
           Feedback.find({},function(er,feedbacks){//for finding and showing feedback in adminhomepage
              if(er){
                  console.log("er2");
                  console.log(er);
                res.redirect("/adminlogin");//if error occured redirect to admin login page
              }
              else{
                  console.log(ambulances,feedbacks);
                  //rendering(showing) feedback in adminpage with its number and status as active feedback
                  res.render("adminhome",{i:i,active:active,feedbacks:feedbacks,ambulances:ambulances}); 
              }
           });
       }
    });
    }
    else{
        res.redirect("/adminlogin");//if admin not 1 it shows admin in not logged in so redirects to adminlogin
    }
   
});

//after filling the feedback form and submiting it,this router post that data into schema of feedback
app.post("/feedbackreceive",function(req,res){
   
    var newfeedback=new Feedback({//creating variable of schema feedback and intilzing it with users feedback  data
        email:req.body.email,//email of feedback dena wala
       full_name:req.body.fullname,//name of feedback dene wala
       mobile:req.body.mobile,//mobile of feeback dene wala
       message:req.body.message//message jo feedback wale ne diya hai
    });
    
    Feedback.create(newfeedback,function(err,feedback){//for creating the feedback and putting in feedback schema
        if(err){//if error redirects to landing page without registering the feeback
            console.log(err);
            return res.redirect("/");//redirecting to top of landing page without feebdback registration
        }
        else{ //if no error redirects to landing page and registering the feeback
            console.log(feedback);
            return res.redirect("/");//redirecting to top of landing page after feebdback registration
        }
    });
    
});

//router that logs user out 
app.get("/logout",function(req, res) {
   req.logout();//logging you out
   req.flash("success","Succesfully logged out!");//flashing logout message 
   res.redirect("/");//redirecting to landing page after logging out
});

//for registering new ambulance that arrives in hospital and putting that in ambulance schema 
app.post("/newambulance",function(req, res) {
    active = 5;
    var newambulance=new Ambulance({//creating variable(object) of ambulance schema 
        amb_id:1,
        vehicle_no:req.body.vno,
        driver_name:req.body.dname,
        driver_contact:req.body.dcont,
        driver_address:req.body.dadd,
        city:req.body.city,
        state:req.body.state,
        zip:req.body.zip,
        status:'Available',
        type:req.body.type,
        reg_date:Date.now(),
        location:'Meditech Office,Jaipur'
    });
    //creating the ambulance and putting data of it in amb schema
    Ambulance.create(newambulance,function(err,ambulance){
        if(err){//if error redirects to admin homepage without registering the ambulance data
            console.log(err);
            return res.redirect("/adminhome");//redirecting to admin homepage without registration
        }
        else{//if no error redirects to admin homepage and register the ambulance data
            console.log(ambulance);
            return res.redirect("/adminhome");//redirecting to admin homepage after registration
        }
    });
    
});

//router that shows the information of ambulance that user req from the database.
app.get("/showambulanceinfo/:id",function(req, res) {
    active = 2;
    var rides=[];
    //findbyId meaning finding amb by its is and populating it with all previous rides taken by it
   Ambulance.findById(req.params.id).populate("previous_rides").exec(function(err,result){
       if(err){
           console.log(err);//if error doesnt show
       } 
       else{
           console.log(result);//result is random variable showing its sucessfull without any err
           //rendering info of amb whose id mactches in database by going to ambulanceinfo ejs page(with tracking info)
           res.render("ambulanceinfo",{result:result});
       }
    }); 
});

//router that redirects us to edit the info about the ambulance requested by user by its id.
app.get("/editambulanceinfo/:id",function(req, res) {
    //findbyId meaning finding amb by its is and populating it with all previous rides taken by it
   Ambulance.findById(req.params.id).populate("previous_rides").exec(function(err,ambulance){
       if(err){
           console.log(err);//if error doesnt allows you to edit
       } 
       else{
            //forwarding you to ambulanceedit ejs page and allows you to edit its info.(also allows you to delink (delete) that ambulance)
           res.render("ambulanceedit",{ambulance:ambulance});
       }
    }); 
});

//for applying filter to admin homepage to help admin in finding thingsout according to prefernce
app.post("/applyfilter",function(req, res) {
    active=1;
    if (req.body.type=="all"){//if admin req all then show him all ambulance 
        Ambulance.find({},function(err,ambulances){//finding all ambulance
       if(err){
           console.log("er1");
           console.log(err);
           res.redirect("/adminlogin");//if err redirects admin to loginpage
       } 
       else{
           Feedback.find({},function(er,feedbacks){//also find all the feedback users have giving and show it to admin
              if(er){
                  console.log("er2");
                  console.log(er);
                res.render("adminlogin");//if err redirects to admin login
              }
              else{
                  console.log(ambulances,feedbacks);
                  //if no err at all then render the adminhome ejs page by passing the feedback list,amb list with their status(active) and count(var i)
                  res.render("adminhome",{i:i,active:active,feedbacks:feedbacks,ambulances:ambulances});
              }
           });
       }
    });
    }
    //else do the same but this time depending of type of ambulance req giving by user
    else{
        Ambulance.find({type:req.body.type},function(err,ambulances){
       if(err){
           console.log("er1");
           console.log(err);
           res.redirect("/adminlogin");
       } 
       else{
           Feedback.find({},function(er,feedbacks){
              if(er){
                  console.log("er2");
                  console.log(er);
                res.render("adminlogin");
              }
              else{
                  console.log(ambulances,feedbacks);
                  res.render("adminhome",{i:i,active:active,feedbacks:feedbacks,ambulances:ambulances}); 
              }
           });
       }
    });
    }
});

//variable for count of differnt types of ambuamce
var basic=0;
var advance=0;
var neo=0;
var air=0;
var mort=0;
var pta=0;

//router for searching the ambulance from location to dest as requested by the user
app.post("/searchambulance",function(req,res){
    console.log(req.body.location)
    console.log(req.body.destination);
    //only finding those ambulance whose status is showing Available
    Ambulance.find({status:'Available'},function(err, ambulances) {
        if(err){
            console.log(err);
            res.redirect("/mainpage");//if err in finding redirecting to use homepage(not landing page)
        }
        else{
            console.log(ambulances);
            //increasing the count of types ambulance which user has ordered
            ambulances.forEach(function(ambulance){
               if(ambulance.type=="Basic Life Support Ambulance"){
                   basic+=1;
               } 
               if(ambulance.type=="Advanced Life Support Ambulance"){
                   advance+=1;
               } 
               if(ambulance.type=="Neonatal Ambulance"){
                   neo+=1;
               } 
               if(ambulance.type=="Patient Transport Vehicle"){
                   pta+=1;
               } 
               if(ambulance.type=="Mortuary Ambulance"){
                   mort+=1;
               } 
               if(ambulance.type=="Air Ambulance"){
                   air+=1;
               } 
            });
            //rendering the book_page ejs page with info: pickup loc,dest loc, ambulance types, count of all ambulance
            res.render("booking_page",{pickup:req.body.location,destination:req.body.destination,ambulances:ambulances,basic:basic,advance:advance,mort:mort,pta:pta,air:air,neo:neo});
        }
    });
});


//router that updates the ambulance info which we edited
app.put("/updateambulance/:id",function(req,res){
    active=1;
    //findIdandUpdate finds the amb by its id req by admin and updates its body(its info in database)
    Ambulance.findByIdAndUpdate(req.params.id,req.body.ambulance,function(err,updatedambulance){
       if(err){
           console.log(err);
           res.redirect("back");//if error info doesnt update and admin is redirected back to prev page of edit info
       }
       else{
           console.log(updatedambulance);
           res.redirect("/adminhome");//if no err then the info is updated in db and admin redirected to admin homepage
       }
   }) ;
});

//router that deletes the ambulance requested by admin to delete
app.delete("/deleteambulance/:id",function(req,res){
    active=1;
    //findIdandRemove finds the amb by its id req by admin and delete it from database.
    Ambulance.findByIdAndRemove(req.params.id,function(err){
      if(err){
          res.redirect("back");//if error info doesnt update and admin is redirected back to prev page of edit info
      } 
      else{
          res.redirect("/adminhome");//if no err then we delete info from db and admin redirected to admin homepage
      }
   });
});

//router that is called when user have decided everything about info and wants to confirm the booking
app.post("/confirmbooking",function(req, res) {
    //finding the types of ambulance and checking if its is indicatinng aviable
    Ambulance.find({type:req.body.type , status:"Available"},function(err, ambulances) {
        if(err){
            console.log(err);
            res.redirect("back");//if err then it redirects back you to previous page
        }
        else{//if no err then before confirm booking storing the booking info in bookinglist schema
            var ambulance=ambulances[0];//ambulance[0] is used to store the info of amb and passing it when rendering diff page
            var booking = new List({// creating variable(object) of bookinglist schema type and storing info in it
               ambulance_id:ambulance._id,
               from:req.body.from,
               to:req.body.to,
               author:{
            id:req.user._id,//id of user who has booked it 
            username:req.user.username//and username of user who has booked it
                },
                isLive:'1'//islive=1 indicating that this ambulance is live (so track its live info)
            });
         List.create(booking,function(err, booking) {//create the object and stores in db.
             if(err){
                 console.log(err);
                 res.redirect("back")//if er in creating the redirected back to prev page
             }
             else{
                 ambulance.previous_rides.push(booking);//adding riding info in prev rides of ambulance
                 ambulance.save();//saving the info in db
                 User.findById(req.user._id,function(err,founduser){//finding the user by its userid in db who booked amb 
                    if(err){
                        console.log(err);
                        res.redirect("back");//if err redirected back to prev page
                    } 
                    else{
                        founduser.previous_bookings.push(booking);//adding riding info in prev rides of user
                        founduser.save();//saving info in db
                        glist=booking;//glist is var(obj) of bookinglist schema types
                        gambulance=ambulance;//gambulance is var(obj) of ambulance
                        var t=Math.floor((Math.random() *10)+5);//var t with creates random wait time 
                        Ambulance.findByIdAndUpdate(ambulance._id,{//find ordered amb by id and changing its status to engaged
                           $set:{
                               status:'Engaged'
                           }
                       },function(err,updated){//now updating and confirm booking 
                          if(err){
                              console.log(err);
                              res.redirect("back");//if er in booking then redirecting back
                          }
                          else{// else confirming the ride and genaerating message and redirecting user
                              console.log(updated);

                            // Your Account SID and Auth Token from twilio.com/console
                            //twilio is rest api for Chatting with customer support, receiving an appointment reminder, messaging a driver, video conferencing with your doctor
                            const accountSid = 'AC2b6dca4154a03105caade2a3569d2df1';
                            const authToken = 'e7a6457d75e2b89e96729ee055fe95f0';
                            const client = require('twilio')(accountSid, authToken);//geneating client token for messaging it
                            
                            client.messages// messaging client info
                              .create({//creating message
                                 body: 'You have got a new RIDE!!GO to the given location fast!! FROM : '+booking.from + 'TO : '+booking.to,
                                 from: '+12028041787',
                                 to: '+919619730222'
                              })
                              .then(message => console.log(message));//messaging the user
                            res.render("thank_you",{ambulance:ambulance,list:booking,t:t});//rendering the thankyoupage with ambulance info,booking info and waitinf time
                          }
                       });
                        // res.redirect("/changestatus/"+ambulance._id);
                    }
                 });
             }
         });   
        }
    });
});

//iski zarrot nhi hai as we have changed the status above,redirected user to confimation page with wait time
// app.put("/changestatus",function(req,res){
//    Ambulance.findByIdAndUpdate(gambulance._id,{
//        $set:{
//            status:'Engaged'
//        }
//    },function(err,updated){
//       if(err){
//           console.log(err);
//           res.redirect("back");
//       }
//       else{
//           console.log(updated);
//           res.render("thank_you",{ambulance:gambulance,list:glist,t:gt});
//       }
//    });
// });

//router that redirects user to onetap booking ejs page
app.get("/onetapbooking",function(req,res){
   res.render("onetapbook"); 
});

//to logout as a admin
app.post("/adminlogout",function(req, res) {
   admin=0;//when you loggout ,intizalize admin to 0 again ,symbolizing you are not admin
   res.redirect("/");//redirecting you to landing page after logging out
});

//router that shows user its all info (user id is used)
app.get("/profile/:id",function(req, res) {
    //findbyId find the user by its id
   User.findById(req.params.id,function(err, founduser) {
      if(err){
          console.log(err);
          res.redirect("back");//redirects you to prev page if any err
      } 
      else{//founderuser stores info of user as which findbyid returns
          res.render("profile",{user:founduser});//else render the profile ejs page and passes the info user
      }
   });
});

//router that show user all the past booking done by him
app.get("/pastbooking",function(req, res) {
    var pastbooking=[];//varibale to store list of all past booking 
    var ambulance_list=[];//varible to store list of all past ambulance booked
   User.findById(req.user._id,function(err, founduser) {//finding user by its id and when found storing his info in founduser var
      if(err){
          console.log(err);
          res.redirect("back");//if err redirects user back to prev page
      } 
      else{
          console.log(founduser.previous_bookings);
          (founduser.previous_bookings).forEach(function(booking){//interating over all the previous booking of user 
              console.log("1");
              //converting  the prev booking list from json type  to list type var
              console.log(booking);
              //after converting it to list we push it to var pastbooking
             List.findById(booking,function(err, found) {
                 if(err){
                     console.log(err);
                 }
                 else{
                     console.log("2");
                     pastbooking.push(found);//pushing that list of converted prev booking to pastbooking(list var)
                     console.log(found);//found stores the all the booking info of user 
                     //finding the ambulance id from the booking info and pushing the ambulance info to var amblist
                     Ambulance.findById(found.ambulance_id,function(err, foundamb) {
                        if(err){
                            console.log(err);
                        } 
                        else{
                            console.log("3");
                            console.log(foundamb);
                            ambulance_list.push(foundamb);//pushing the found prev ambulane list of user and storing it in variable
                        }
                     });
                 }
             });
          });
      }
   });
        setTimeout(function(){//using the settimeout to redirest the user
            console.log("amb list");
          console.log(ambulance_list);
          console.log("past:");
          console.log(pastbooking);
          //rendering the prevbooking ejs page with user's pastbooking info list and its prev amb list
          res.render("prevbooking",{list:pastbooking,ambulances:ambulance_list});
        }, 2000);
});

//router that renders(shows) user the all the features of ambulance and hospital
app.get("/features",function(req,res){
   res.render("features"); 
});

//router that logs user out and redirects him to landing page
app.get("/logout",function(req, res) {
    req.logout();
    res.redirect("/");
});

const hostname = '127.0.0.1';//name of host which is hosting the website
const port = 8000;//port on which we are listening

app.listen(port,hostname,function(req,res){//making app to listen on port and hostname and run the website
   console.log("Meditech server running....."); 
});
