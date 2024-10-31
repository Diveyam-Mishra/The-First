import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const user_info=new Schema(
    {
    username : {
        type: String,
        unique:true ,
        required: true,
        lowercase:true,
        trim:true,
        index:true
    },
    fullName: {
        type: String,
        required: true,
        trim:true
    },
    email:{
        type: String,
        unique:true ,
        required: true,
        lower_case:true
    },
    dob:{
        type: Date
    },
    avatar:{
        type: String
    },
    // friendList:{

    // },
    password:{
        type:String,
        required:[true,'Password is required'],
        min:6
    },
    refreshToken:{
        type:String
    }   
    },{timestamps:true}
)

user_info.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password= await bcrypt.hash(this.password,8)
    next()
})

user_info.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

user_info.methods.generate_acess_token= function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        fullName:this.fullName
    },
    process.env.JWT_TOKEN,
    {
        expiresIn:process.env.JWT_EXPIRY
    }
)
}

user_info.methods.generate_refresh_token= function(){
    return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN,
    {
        expiresIn:process.env.REFRESH_EXPIRY
    }
)
}


export const User =mongoose.model("User",user_info)