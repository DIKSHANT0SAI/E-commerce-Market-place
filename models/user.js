 import mongoose, { mongo } from "mongoose";
 const userSchema = new mongoose.Schema({
    _id:{type:String , required : true},
    name :{type : String , required : true},
    email :{type : String , required : true, unique:true},
    imageUrl : {type : String , required : true},
    cartItems : {type : Object , default : {}}
 },{minimize:false})

 export const User = mongoose.models.user || mongoose.model('user',userSchema)
 // this line will make user use model wil not creaete again na agian