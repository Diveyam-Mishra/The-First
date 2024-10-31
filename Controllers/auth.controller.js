import {asyncHandler} from "../Utils/asyncHandler.js"
import { ApiError } from "../Utils/ApiError.js"
import { User } from "../Models/user_info.model.js"
import { ApiResponse} from  "../Utils/ApiResponse.js"
import {uploadToAzureBlob} from "../Utils/Blobstorage.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessandRefreshToken= async (userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken  =   user.generate_acess_token()
        const  refreshToken= user.generate_refresh_token()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {refreshToken,accessToken}
    }
    catch(error){
        throw new ApiError(500,"Internal Server Error")
    }
}


const registerUser= asyncHandler(async (req,res)=>{
    const {fullName, email, username, password } = req.body
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadToAzureBlob(avatarLocalPath)
    const coverImage = coverImageLocalPath 
    ? await uploadToAzureBlob(coverImageLocalPath)
    : "https://www.ouinolanguages.com/assets/French/vocab/8/images/pic7.jpg";


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar,
        coverImage: coverImage,
        email, 
        password,
        username: username.toLowerCase()
    })
    console.log(user)
    console.log(user.password)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req,res)=>{
    console.log(req.body)
    const {email, username, password} = req.body
    console.log(email)
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }
    if (!password ){
        throw new ApiError (404, "Send Password")
    }

    const  user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user){
        throw new ApiError(404, "user not found")
    }
    console.log("Stored password hash:", user.password);
    console.log("Provided password:", password);
    const password_resp= await user.isPasswordCorrect(password)
    
    console.log("Password comparison result:", password_resp);
    if (!password_resp){
        throw new ApiError(401, "passowrd is wrong")
    }
    const {refreshToken,accessToken}= await generateAccessandRefreshToken(user._id)
    
    const options={
        httpOnly:true,
        secure:true
    }
    
    return res.status(200)
    .cookie("AcessToken",accessToken,options)
    .cookie("RefreshToken",refreshToken,options)
    .json(new ApiResponse(
        200, {
            user: user,accessToken,refreshToken
        }
    ))

})


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const checkUniqueFields = asyncHandler(async (username, email) => {
    const conditions = [];
    if (username) conditions.push({ username });
    if (email) conditions.push({ email });

    if (conditions.length === 0) return;

    const existingUser = await User.findOne({
        $or: conditions
    });

    if (existingUser) {
        throw new ApiError(401, "Username or Email is not unique");
    }
});

const updateUserDetails = asyncHandler(async(req, res) => {
    const { fullName, email, username, works_at, contact_no, dob, gender } = req.body;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }
    checkUniqueFields(username, email);
    const updates = {
        ...(fullName && {fullName}),
        ...(email&&{email}),
        ...(username && { username }),
        ...(works_at && { works_at }),
        ...(contact_no && { contact_no }),
        ...(dob && { dob }),
        ...(gender && { gender })
    };

    
    if (avatarLocalPath) {
        const avatar = await uploadToAzureBlob(avatarLocalPath);
        await deleteOldFile(user.avatar);
        if (avatar) updates.avatar = avatar;
    }

    
    if (coverImageLocalPath) {
        const coverImage = await uploadToAzureBlob(coverImageLocalPath);
        if (coverImage) updates.coverImage = coverImage;
        if (user.coverImage) {
            await deleteOldFile(user.coverImage);
        }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select("-password");

    return res.status(200).json(new ApiResponse(200, updatedUser, "User details updated successfully"));
});


const deleteOldFile = async (fileUrl) => {
    try {
        const blobName = fileUrl.split("/").pop().split("?")[0];
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();
        console.log(`Deleted old file: ${blobName}`);
    } catch (error) {
        console.error("Error deleting old file:", error);
    }
};

export {
    registerUser,loginUser,logoutUser,changeCurrentPassword,refreshAccessToken,getCurrentUser,updateUserDetails
}