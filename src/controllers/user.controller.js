import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js";  
import {uploadOnCloudnary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
   //get user details from frontend
   //Validation (email format,  not-empty)
   //check if user already exists:username,email
   //check for image, check for avater
   //upload them to cloudinary server,avatar
   //create user object -creation entry in db 
   //remove password and refresh token feild from response
   //check for user creation 
   //return response

  const  {fullname,email,username,password} = req.body;
  console.log("email",email);

  if([fullname,email,username,password].some((feild=>feild?.trim()=== ""))){
      throw new ApiError(400,"")
  }
   
  
  const existedUser= User.findOne({
    $or : [{username}, {email}]
  })
  if(existedUser){
    throw new ApiError(409,"User with email or username already exists");
  }
  const avatarLocalPath=req.files?.avatar[0]?.path;
 const coverImageLocalPath= req.files?.coverImage[0]?.path;
 if(!avatarLocalPath){
  throw new ApiError(400,"Avatar is required")
 }

  const avatar =await uploadOnCloudnary(avatarLocalPath);
  const coverImage=await uploadOnCloudnary(coverImageLocalPath);
 
  if(!avatar){
    throw new ApiError(400,"Avatar is required");
  }
  const User=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })
  const createdUser=await User.findById(user._id).select("-password -refreshToekn")

  if(!createdUser){
    throw new ApiError(505,"Something wrong while registering the user")
  }
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully")
  )
  
});

export { registerUser };
