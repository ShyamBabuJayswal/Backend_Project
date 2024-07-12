import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";  
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";
import mongoose from "mongoose";


const generateAccessAndRefreshToken  = async(userId)  =>{
   try {
     const user = await User.findById(userId)
   const accessToken  = user.generateAccessToken()
   const refreshToken= user.generateRefreshToken()

    user.refreshToken =refreshToken
   await user.save({validateBeforeSave:false})
    
   return {accessToken,refreshToken}


   } catch (error) {
       throw new ApiError(500,"Something went worng while generating access and refresh token");
   }
}

const registerUser = asyncHandler(async (req, res) => {
    // Get user details from frontend
    const { fullName, email, username, password } = req.body;
    // console.log("email", email);

    // Validation
    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "Every field is required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Check for avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
 let coverImageLocalPath;
 if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
  coverImageLocalPath = req.files.coverImage[0].path;
 }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // Upload avatar and cover image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    // Create user object
    const newUser = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // Find created user without password and refreshToken
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(505, "Something went wrong while registering the user");
    }

    // Return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req,res) => {
  //req body -> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookies

  const {email,username,password} = req.body;

  if(!username  && !email){
    throw new ApiError(404,"username or email is required")
  }

const user = await User.findOne({
  $or:[{username},{email}]
 });

 if(!user){
  throw new ApiError(404,"User done not exit");

}

 const isPasswordValid = await user.isPasswordCorrect(password);

 if(!isPasswordValid){
  throw new ApiError(401,"Invalid user credentials")
 }

const  {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id);


const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

const options ={
    httpOnly:true,
    secure:true,
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User loggedIn Successfully"
    )
  )

})


 const logoutUser=asyncHandler(async(req,res) =>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                resfreshToken:1
            }
        },
        {
        new:true
        }
    )
    const options ={
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))
 })

 const refreshAccessToken = asyncHandler(
    async(req,res) => 
        {
 const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;
 if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized  access")
 }
 
 try {
    const decodedToken = jwt.verify(
       incomingRefreshToken,
       process.env.ACCESS_TOKEN_SECRET,
    )
    const user = User.findById(decodedToken?._id)
    if(!user){
       throw new ApiError(401,"Invalid refresh token")
    }
   
    if(incomingRefreshToken !== user?.refreshToken){
       throw new ApiError(401,"Refresh token is expired or used")
    }
     
    const options={
       httpOnly:true,
       secure:true
    }
   
      const {accessToken,newrefreshToken}=await generateAccessAndRefreshToken(user._id)
       
      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newrefreshToken,options)
      .json(
       new ApiResponse(
           200,
           {accessToken,refreshToken:newrefreshToken},
           "Access token refreshed"
       )
      )
 } catch (error) {
throw new ApiError(401,error?.message|| "Invalid refresh token" )
 }
})

 const changeCurrentPassword = asyncHandler(
    async(req,res) => 
        {
            const {oldPassword,newPassword} = req.body
            
            const user = await User.findById(req.user?._id)
        const isPasswordCorrect  = await user.isPasswordCorrect(oldPassword)
        if(!isPasswordCorrect){
            throw new ApiError(400,"Invalid Password")
        }
        user.password  = newPassword
       await user.save({validateBeforeSave:false})

       return res
       .status(200)
       .json(new ApiResponse(200,{},"Password changed Succesfully"))

        }
 )


 const getCurrentUser = asyncHandler(async(req,res)=>
    {
    return res
    .status(200)
    .json(200,re.user,"current user fetched successfully")
  }
  )
  
 const updateAccountDetails = asyncHandler(
    async(req,res) =>{
       const {fullName,email}  = req.body; 
       if(!fullName || !email){
        throw new ApiError(400,"All feild are required");
       }
      const user  = User.findByIdAndUpdate(
        req.user?._id,
         {
            $set:{
                fullName,
                email:email,
            }
         },
        
         {
            new:true
        }
        )
        .select("-password")
        return res
        .status(200)
        .json(new ApiResponse(200,user,"Account details updated succesfully"));
    }
 ) 

 const updateUserAvatar  = asyncHandler(
    async(req,res)  =>
        {
       const avatarLocalPath = req.file?.path()
       if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
       }
     const avatar = await  uploadOnCloudinary(avatarLocalPath);

     if(avatar.url){
        throw new ApiError(404,"Error while uploading on avatar file")
     }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}

     ).select("-password")

     return res
     .status(200)
     .json(
        new ApiResponse(200,user,"avatar updated succesfully"))
       
    })
    
    const updateUserCoverImage  = asyncHandler(
        async(req,res)  =>
            {
           const coverImageLocalPath = req.file?.pat()
           if(!coverImageLocalPath){
            throw new ApiError(400,"CoverImage file is missing")
           }
         const coverImage = await  uploadOnCloudinary(coverImageLocalPath);
    
         if(!coverImage.url){
            throw new ApiError(404,"Error while uploading on coverImage file")
         }
    
       const user = await User.findByIdAndUpdate(req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {new:true}
    
         ).select("-password")

         return res
         .status(200)
         .json(
            new ApiResponse(200,user,"Cover Image updated succesfully")
         )
           
        })


  const getUserChannelProfile  = asyncHandler(async(req,res) => {
     const {username}=req.params  

     if(!username?.trim()){
        throw new ApiError(400,"username is missing")
     }

     const channel =  await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscribers",
                    as:"subscriberdTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelsSubscribedToCount:{
                        $size:"$subscriberdTo"
                    },
                    isSubscribed:{
                        $cond:{
                           if:{
                            $in:[req.user?._id,"$subscribers.subscriber"]
                           },
                           then:true,
                           else:false
                        
                }
                    }
                }
            },
            {
                $project:{
                    fullName:1,
                    username:1,
                    subscribersCount:1,
                    channelsSubscribedToCount:1,
                    isSubscribed:1,
                    avatar:1,
                    coverImage:1,
                    email:1
                }
            }
        
     ])

    
      if(!channel?.length){
        throw new ApiError(404,"channel does not exists");
      }

      return res
      .status(200)
      .json(
        new ApiResponse(200,channel[0],"User channel fetched succesfully")
      )


    }) 


   const getWatchHistory = asyncHandler(async(req,res) => {
       const user = await User.aggregate([
        {
            $match:{

                _id:new mongoose.Types.ObjectId(req.user._id)
            },
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[{
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[{
                           $project:{
                            fullName:1,
                            username:1,
                            avatar:1,
                           } 
                        }]
                    }
                },
                {
                  $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                  }  
                }

            ]
            }


        }
       ])
       return res
       .status(200)
       .json(
        new ApiResponse(
            200,
            user[0].WatchHistory,
            "WatchHistory fetch succesfully"
        )
       )

   }) 
   
   

export { registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
      getCurrentUser,
      updateAccountDetails,
      updateUserAvatar,
      updateUserCoverImage,
      getUserChannelProfile,
      getWatchHistory
    };
