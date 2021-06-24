import { Schema, Document, model } from 'mongoose';

const LastPersonSchema: Schema = new Schema({
  id1: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  id2: {
    type: String,
    required: true,
  },
});

export interface LastPersonProps extends Document {
  id1: string;
  id2: string;
}

export default model<LastPersonProps>('lastperson', LastPersonSchema);
