import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const generateAccessAndRefreshToken = async(userId) => {
    try {
      const user = await User.findById(userId);  
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false }); //No need to validate
      return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const registerUser = asyncHandler( async (req, res) => {
    /*
    1. Get details from frontend
    2. Validation - not empty
    3. Check if user already exists. (Username & Email)
    4. Check for images (Avatar & Coverphoto)
    5. Upload them on cloudinary
    6. Create user object - Create entry in db
    7. Remove password and refresh token field from response
    8. Check for user creation
    9. Return response 
    */

     const {username, fullName, email, password } = req.body;
     
     if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
     ){
        throw new ApiError(400, "All fields are required");
     }

     const existedUser = await User.findOne({
        $or: [{ username }, { email }]
     });

     if(existedUser){
        throw new ApiError(409, "User with email or username already exists");
     }

     console.log(req.files);

     const avatarLocalPath = req.files?.avatar[0]?.path;
    //  const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //coverImage is an optional 
     let coverImageLocalPath=null;
     if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
     }
     if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is requried");
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath);
     
     
      const coverImage = coverImageLocalPath !== null ? await uploadOnCloudinary(coverImageLocalPath): "";
     

     if(!avatar){
        throw new ApiError(400, "Avatar file is required");
     }

     const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
     });

     const createdUser = await User.findById(user._id).select("-password -refreshToken");

     if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user");
     }

     return res.status(201).json(
       new ApiResponse(200, createdUser, "User registered successfully")
     );

} );

const loginUser = asyncHandler( async (req, res) => {
    /*
        1. req body => data
        2. extract username & email and try to login on the basis of either one
        3. Find the user
        4. Password check
        5. Access & Refresh token
        6. Send secure cookies
        7. Send success response
    */
   const {username, email, password} = req.body;

   if(!username || !email){
        throw new ApiError(400, "Username & Password is required");
   }

   const user = await User.findOne({
    $or: [{ username },{ email }]
   });

   if(!user){
    throw new ApiError(404, "User does not exist");
   }

   const isPasswordValid = await user.isPasswordCorrect(password);

   if(!isPasswordValid){
    throw new ApiError(401, "Invalid user credentials");
   }

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

   const options = {
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
    }, "User logged in successfully")
   );
});

export {registerUser, loginUser};