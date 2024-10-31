import express from 'express';
import {upload} from "../Middlewares/Multer.js"
import {registerUser,loginUser,logoutUser,changeCurrentPassword,refreshAccessToken,getCurrentUser,updateUserDetails} from "../Controllers/auth.controller.js"
import { verifyJWT } from '../Middlewares/auth.js';

const router = express.Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"CoverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateUserDetails)

export default router;