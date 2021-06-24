import { Schema, Document, model } from 'mongoose';
import GenderEnum from '../../enums/GenderEnum';

const ChatRoomSchema: Schema = new Schema({
  id1: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  id2: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  gender1: {
    type: String,
    enum: Object.keys(GenderEnum),
    required: true,
  },
  gender2: {
    type: String,
    enum: Object.keys(GenderEnum),
    required: true,
  },
  time: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

export interface ChatRoomProps extends Document {
  id1: string;
  id2: string;
  gender1: GenderEnum;
  gender2: GenderEnum;
  time: Date;
}

export default model<ChatRoomProps>('chatroom', ChatRoomSchema);
