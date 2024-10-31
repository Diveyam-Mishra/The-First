import {asyncHandler} from  '../Utils/asyncHandler.js'
import { ApiError } from "../Utils/ApiError.js"
import { User } from "../Models/user_info.model.js"
import { ApiResponse} from  "../Utils/ApiResponse.js"
import {uploadToAzureBlob} from "../Utils/Blobstorage.js"
import Chat from '../Models/chat.model.js';
import {io} from "../app.js"


const messageTypes = {
    TEXT: 'text',
    LINK: 'link',
    PHOTO: 'photo',
    DOCUMENT: 'document'
  }

const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
  
export const getOrCreatePersonalChat = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new ApiError(404, "User Not found")
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, recipientId] },
  });

  if (!chat) {
    chat = await Chat.create({
      isGroupChat: false,
      users: [req.user._id, recipientId],
    });
  }

  if (content || req.files) {
    let messageContent;
    let messageType = messageTypes.TEXT;
    let fileUrl;
    if (req.files) {
      const file = req.files.file;

      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        if (file.size > MAX_PHOTO_SIZE) {
          throw new ApiError(400, "Photo size exceeds limit of 5MB");
        }
        messageType = messageTypes.PHOTO;
      } else if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        if (file.size > MAX_DOCUMENT_SIZE) {
          throw new ApiError(400, "Document size exceeds limit of 10MB");
        }
        messageType = messageTypes.DOCUMENT;
      } else {
        throw new ApiError(400, "Unsupported file type");
      }

      // Upload file to Azure Blob Storage
      const blobName = `${Date.now()}-${file.name}`;
      fileUrl = await uploadToAzureBlob(file.data, blobName, file.mimetype);
      messageContent = {
        url: fileUrl,
        fileName: file.name,
        fileType: file.mimetype,
        fileSize: file.size
      };
    } else {
      messageContent = content;
      
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (urlPattern.test(content)) {
        messageType = messageTypes.LINK;
        messageContent = {
          url: content,
          preview: await generateLinkPreview(content)
        };
      }
    }

    const message = {
      sender: req.user._id,
      content: messageContent,
      messageType,
      timestamp: new Date(),
    };

    chat.messages.push(message);
    await chat.save();

    io.of('/chat').to(chat._id.toString()).emit('newMessage', {
      ...message,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar
      }
    });
  }

  return res.status(201).json(
    new ApiResponse(200, chat, "Message sent successfully")
  );
});

const generateLinkPreview = async (url) => {
    //To be written
    return {
      title: '',
      description: '',
      image: '',
      domain: new URL(url).hostname
    };
  };


export const getChatMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
  
    const chat = await Chat.findById(chatId)
      .populate('users', 'name avatar')
      .populate('messages.sender', 'name avatar')
      .slice('messages', [(page - 1) * limit, limit])
      .sort({ 'messages.timestamp': -1 });
  
    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }
  
    // Verify user is part of the chat
    if (!chat.users.some(user => user._id.equals(req.user._id))) {
      throw new ApiError(403, "Access denied");
    }
  
    return res.status(200).json(
      new ApiResponse(200, chat.messages, "Messages retrieved successfully")
    );
  });
  
  

 
export const getOrCreateGroupChat = asyncHandler(async (req, res) => {
  const { groupName, userIds } = req.body;

  if (!groupName || !userIds || userIds.length < 2) {
    return res.status(400).json({ message: 'Group name and at least 2 users are required' });
  }

  const chat = await Chat.create({
    isGroupChat: true,
    chatName: groupName,
    users: [req.user._id, ...userIds],
  });
  if (content) {
    const message = {
      sender: req.user._id,
      content: content,
      timestamp: new Date(),
    };
    chat.messages.push(message);
    await chat.save();

    io.of('/chat').to(chat._id.toString()).emit('newMessage', message);
  }
  res.status(201).json(chat);
});

