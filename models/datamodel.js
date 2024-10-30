const mongoose=require('mongoose')
mongoose.connect("mongodb://localhost:27017/notepad")
 const datamodels= mongoose.Schema({
    user:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'user'
    },
    name:String,
    data:String,
    
 },{timestamps:true})
  
module.exports= mongoose.model("note",datamodels)