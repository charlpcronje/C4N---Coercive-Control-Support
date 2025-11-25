export interface BehaviorItem {
  ref: string;
  text: string;
  checked: boolean;
  done?: boolean;
  user_added: boolean;
  description?: string;
  example?: string;
}

export interface Media {
  id: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  thumbnail?: string;
  caption?: string;
}

export interface SectionData {
  title: string;
  intro?: string;
  description?: string;
  media?: Media;
  offender_behavior?: BehaviorItem[];
  victim_behavior?: BehaviorItem[];
}

export interface AppData {
  [key: string]: SectionData;
}

export interface Note {
  id?: number;
  sectionKey: string;
  itemRef: string;
  text: string;
  timestamp: string;
}

export interface Resource {
  id?: number;
  sectionKey: string;
  url: string;
  title: string;
  timestamp: string;
}

export type Page = 'home' | string;