import express from 'express';
import { getOrCreatePersonalChat, getOrCreateGroupChat, getChatMessages} from '../Controllers/chat.contoller.js';
import { upload } from '../Middlewares/Multer.js';
import { verifyJWT } from '../Middlewares/auth.js';

const router = express.Router();

router.use(verifyJWT);


const fileUpload = upload.single('file');
router
.route('/personal')
.post(fileUpload, getOrCreatePersonalChat);

router
.route('/:chatId/messages')
.get(getChatMessages);  

router
.route('/group')
.post(verifyJWT, getOrCreateGroupChat);


router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: 'File size is too large. Max limit is 10MB'
    });
  }
  next(err);
});

export default router;