import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import  {comment} from "../models/comment.model.js";


// get all comments for videos
const getAllVideoComment = asyncHandler(async(req,res) => {

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    if(!NaN(pageNumber) || pageNumber<1){
        return new ApiError(400,"Invalid page number");
    }
    if(!NaN(limitNumber) || limitNumber<10){
        return new ApiError(400,"Invalid limit number");
    }
    try{

    const pipeline = [
        {
            $match:{
                video:mongoose.Types.ObjectId(videoId)
                   },
                },           
            {
                $sort:{
                    createdAt:-1,
                }
            } ,
         {
            $lookup:{
                from:"user",
                localFeild:"owner",
                foriegnFeild:"_id",
                as:"owner",
            },
         } ,
         {
            $unwind:"$owner",
                
            
         } ,
         {
            $project:{
            
            content: 1,
                    owner: { 
                        _id: 1,
                         name: 1,
                          email: 1 
                        }, 
                    createdAt: 1,
                },
            },
        ];
         
        const options = {
            page: pageNum,
            limit: limitNum,
        };

        // Execute aggregation with pagination
        const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

        res.json(new ApiResponse({
            page: comments.page,
            limit: comments.limit,
            totalPages: comments.totalPages,
            totalDocs: comments.totalDocs,
            docs: comments.docs,
        }));
    } 
    catch (error) {
        throw new ApiError(500, "Server error", error.message);
    }
});


// add comments to the video
const addComment = asyncHandler(async(req,res) => {
  const {videoId,content} = req.body;
  if(!videoId || !content){
    return new ApiError(404,"Invalid video id or content");
  }

  try {
     const newComment= new comment({
        video:videoId,
        content:content,
        owner:req.user._id,
     })
     const savedComment=await newComment.save();
     res.status(201).json(new ApiResponse({
        success: true,
        message: "Comment added successfully",
        comment: savedComment
    }));
     
  } catch (error) {
    return new ApiError(500,"Failed to add comment");
  }

})


  export {
    getAllVideoComment
  }      
    




