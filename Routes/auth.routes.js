import express from 'express';
import {upload} from "../Middlewares/Multer.js"
import {registerUser,loginUser} from "../Controllers/auth.controller.js"
const router = express.Router();
/**
 * @swagger
 * /register:
 * post:
 *     summary: Register a new user
 *     description: Registers a new user with required fields and optional cover image
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 required: true
 *                 description: Full name of the user
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 required: true
 *                 description: Avatar image file
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file (optional)
 *               email:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 required: true
 *                 description: User's password
 *               username:
 *                 type: string
 *                 required: true
 *                 description: User's username
 *             required:
 *               - fullName
 *               - avatar
 *               - email
 *               - password
 *               - username
 *     responses:
 *       '201':
 *         description: User created successfully
 *       '400':
 *         description: Bad request (invalid data)
 */
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

export default router;