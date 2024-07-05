import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";  
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

  if(!username  || !email){
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

export { registerUser, loginUser };
