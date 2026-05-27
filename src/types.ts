export interface Exercise {
  id: string;
  title: string;
  durationString: string; // e.g. "0:12"
  durationSeconds: number; // e.g. 12
  text: string; // The English sentence
  level: 'beginner' | 'intermediate' | 'advanced';
  levelLabel: string; // "初级" | "中级" | "高级"
}

export type ToneType = 'up' | 'down' | null;

export interface WordAnnotation {
  wordIndex: number;
  word: string;
  tone: ToneType; // 'up' (red rising symbol ↗) , 'down' (green falling symbol ↘), or null
  isWeak: boolean; // if true, font decreases by 1 size level
  isTranslated: boolean; // if true, replaces original English word with Chinese definition
  translation: string; // AI generated Chinese definition
}

export interface TextAnnotationState {
  words: WordAnnotation[];
  links: number[]; // indices of words that link to the immediately NEXT word. e.g. [0] means word[0] and word[1] are linked
}

export interface PracticeRecord {
  id: string; // timestamp or UUID
  date: string; // e.g. "2026-05-26"
  level: string; // e.g. "初级"
  title: string; // e.g. "Greeting a Friend"
  grade: 'C' | 'B' | 'A' | 'S';
  scores: {
    intonation: 'C' | 'B' | 'A' | 'S';
    rhythm: 'C' | 'B' | 'A' | 'S';
    pronunciation: 'C' | 'B' | 'A' | 'S';
  };
}
