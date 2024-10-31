import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  messageType: {
    type: String,
    enum: ['text', 'link', 'photo', 'document'],
    default: 'text'
  },
  timestamp: Date,
});

const chatSchema = new mongoose.Schema({
  isGroupChat: { type: Boolean, default: false },
  chatName: { type: String },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [messageSchema],
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
