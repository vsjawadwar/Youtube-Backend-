import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env"
});

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`Server is running at port: ${process.env.PORT}`);
  });
})
.catch((err)=>{
  console.log("Mongodb connection failed !!!", err);
});




/*
import mongoose from "mongoose";
import { DB_Name } from "./constants";
import express from 'express';
//Database can be connected by two ways IIFE
const app = express();
(async () => {
    try {
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`); 
      app.on("Error",(error)=>{
        console.log("Error", error);
        throw error;
      });
      app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
      });
    } catch (error) {
        console.error("Error", error);
        throw error;
    }
})();
*/