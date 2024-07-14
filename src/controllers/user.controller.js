import {asyncHandler} from "../utils/asyncHandler.js"

const registerUser = asyncHandler( async (req, res) => {
    console.log("Hello");
   res.status(200).json({
        message: "Jay Shree Ram" 
    });
} );

export {registerUser};