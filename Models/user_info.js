import mongoose, { Schema } from "mongoose";
const user_info=mongoose.Schema(
    {
    username : {
        type: String,
        unique:true ,
        required: true
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
    name:{
        type: String
    },
    password:{
        required:[true,'Password is required'],
        min:6
    }},{timestamps:true}
)




export const User =mongoose.model("User",user_info)