export type Level = 'biennio' | 'triennio' | 'maturita';

export interface AttachedFile {
  name: string;
  type: string;
  size: number;
  base64: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  level?: Level;
  file?: AttachedFile;
}

export interface LevelDetails {
  id: Level;
  label: string;
  emoji: string;
  tag: string; // es: [🟢 BIENNIO]
  badge: string; // es: "14-16 ANNI"
  description: string;
  accentColor: string; // nome colore Tailwind (es: 'emerald')
  bgClass: string; // classe o colore bg per il bottone attivo
  borderClass: string; // classe bordo per il bottone attivo
  textClass: string; // classe testo colore
  focusRingClass: string; // cerchio di focus
}
