import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDNINARY_CLOUD_NAME,

    api_key:process.env.CLOUDNINARY_API_KEY,

    api_secret: process.env.CLOUDNINARY_API_SECRET 
});

 const uploadOnCloudinary = async(localFilePath) => {
    try {
       if(!localFilePath) return null 
       //upload file on cloudinary
     const response = await  cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
    })
    //file has been uploaded successfully
    console.log("File is uploaded on cloudinary",response.url);
    return response
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the local saved temporary file as the upload file fail
    }
 }

 export {uploadOnCloudinary}