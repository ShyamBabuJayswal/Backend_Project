import mongoose,{Schema} from "mongoose";



const LikeSchema = new Schema({

    video:{
       type:Schema.Types.ObjectId,
        ref:"Video" 
    },
    comment:{
       type:Schema.Types.ObjectId,
        ref:"comment" 
    },
    tweet:{
        ype:Schema.Types.ObjectId,
        ref:"tweet"
    },
    likedby:{
        ype:Schema.Types.ObjectId,
        ref:"User"
    }
},
{
    timestamps:true,
}
)



export const Like=mongoose.model("Like",LikeSchema)