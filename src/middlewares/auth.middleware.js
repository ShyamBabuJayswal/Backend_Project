import { User } from "../models/user.models";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.models";
import jwt from "jsonwebtoken";

export const verifyJWT=asyncHandler(async(req,_,next)=>{
   try {
    const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
    if(!token){
     throw new ApiError(401,"Unauthorized request")
    }
    
    const decodedToken  = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
     const user  = await User.findById(decodedToken?._id).select("-password -refreshToken") 
 
     if(!user){
         throw new ApiError(401,"Invalid AccessToken")
     }
      req.user =user
      next()
   } catch (error) {
     throw new ApiError(401,error?.message || "Invalid access token" )
   }

})