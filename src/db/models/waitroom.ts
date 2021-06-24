import { Schema, Document, model } from 'mongoose';
import GenderEnum from '../../enums/GenderEnum';

const WaitRoomSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  gender: {
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

export interface WaitRoomProps extends Document {
  id: string;
  gender: GenderEnum;
  time: Date;
}

export default model<WaitRoomProps>('waitroom', WaitRoomSchema);
