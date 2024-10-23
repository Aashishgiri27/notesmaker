const mongoose=require('mongoose')

const userschema=mongoose.Schema({
    username:String,
    email:String,
    password:String,
    profilepic:{
        type:String,
        default:"userprofilepic.png"
    },
    file:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'note'
        }
    ]
})

module.exports=mongoose.model("user",userschema)