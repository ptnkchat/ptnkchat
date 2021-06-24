import { Schema, Document, model } from 'mongoose';
import GenderEnum from '../../enums/GenderEnum';

const GenderSchema: Schema = new Schema({
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
});

export interface GenderProp extends Document {
  id: string;
  gender: GenderEnum;
}

export default model<GenderProp>('gender', GenderSchema);
