import GenderEnum from '../enums/GenderEnum';

export interface ChatRoomEntry {
  id1: string;
  id2: string;
  gender1: GenderEnum;
  gender2: GenderEnum;
  time: Date;
}

export interface WaitRoomEntry {
  id: string;
  gender: GenderEnum;
  time: Date;
}

export interface GenderEntry {
  id: string;
  gender: GenderEnum;
}

export interface LastPersonEntry {
  id1: string;
  id2: string;
}
