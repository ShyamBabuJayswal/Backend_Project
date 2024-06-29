
import dotenv from "dotenv";
import mongoose from "mongoose";
import {DB_NAME} from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:'./env'
})


connectDB().then(()=>{
  app.listen(process.env.PORT|| 8080 ,()=>{
    console.log(`Server is running on port :${process.env.PORT} `)
  })
}).catch((err)=>{
  console.log("Mongo db conntecion faild !!!",err);
  throw err;
})











/*
import express from "express";
const app=express();
(async ()=>{
  try{
   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
   app.on("error",()=>{
    console.log("Error",error);
    throw error;
   });
   app.listen(process.env.PORT,()=>{
    console.log(`Listening on port      ${process.env.PORT}`);
   })
  }
  catch(error){
    console.error("Error",error);
    throw err
  }
})()*/