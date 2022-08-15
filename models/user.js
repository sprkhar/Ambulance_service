var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
   username:String,
   full_name:String,
   mobile:String,
   password:String,
   resetPasswordToken:String,
   resetPasswordExpires:Date,
   previous_bookings: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "List"
  }
]
});

userSchema.plugin(passportLocalMongoose); //use of this line is to bulid username and password (more explain below)
// Passport-Local Mongoose will add a username, hash and salt field to store the username, the hashed password and the salt value.

module.exports=mongoose.model("User",userSchema);
