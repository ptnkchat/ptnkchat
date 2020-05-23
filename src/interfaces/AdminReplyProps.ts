import { ChatRoomEntry, WaitRoomEntry, GenderEntry, LastPersonEntry } from './DatabaseEntry';
import { UserProfileResponse } from './FacebookAPI';

export interface AdminReplyProps {
  success?: boolean;
  error?: boolean;
  errorType?: string;
  chatRoom?: ChatRoomEntry[];
  waitRoom?: WaitRoomEntry[];
  gender?: GenderEntry[];
  lastPerson?: LastPersonEntry[];
  userProfile?: UserProfileResponse;
  msg?: string;
  cpu?: string;
  mem?: string;
  uptime?: string;
  version?: string;
}
