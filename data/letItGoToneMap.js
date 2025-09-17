import { createToneMapFromMelody } from '../utils/toneMap';

/**
 * "Let It Go" from Frozen - Simplified melody for demonstration
 * This is a basic version focusing on the main vocal line
 */

// Main melody data for "Let It Go" (simplified)
const letItGoMelody = [
  // "The snow glows white on the mountain tonight"
  { note: 'F4', duration: 0.5, lyric: 'The' },
  { note: 'F4', duration: 0.5, lyric: 'snow' },
  { note: 'G4', duration: 0.5, lyric: 'glows' },
  { note: 'A4', duration: 0.5, lyric: 'white' },
  { note: 'A4', duration: 0.5, lyric: 'on' },
  { note: 'A4', duration: 0.5, lyric: 'the' },
  { note: 'G4', duration: 0.5, lyric: 'moun-' },
  { note: 'F4', duration: 0.5, lyric: 'tain' },
  { note: 'F4', duration: 1.0, lyric: 'to-' },
  { note: 'C4', duration: 1.0, lyric: 'night' },
  { note: '--', duration: 0.5 }, // Rest
  
  // "Not a footprint to be seen"
  { note: 'F4', duration: 0.5, lyric: 'Not' },
  { note: 'F4', duration: 0.5, lyric: 'a' },
  { note: 'G4', duration: 0.5, lyric: 'foot-' },
  { note: 'A4', duration: 0.5, lyric: 'print' },
  { note: 'A4', duration: 0.5, lyric: 'to' },
  { note: 'A4', duration: 0.5, lyric: 'be' },
  { note: 'G4', duration: 1.0, lyric: 'seen' },
  { note: '--', duration: 1.0 }, // Rest
  
  // "A kingdom of isolation"
  { note: 'D4', duration: 0.5, lyric: 'A' },
  { note: 'F4', duration: 0.5, lyric: 'king-' },
  { note: 'G4', duration: 0.5, lyric: 'dom' },
  { note: 'A4', duration: 0.5, lyric: 'of' },
  { note: 'Bb4', duration: 0.5, lyric: 'i-' },
  { note: 'A4', duration: 0.5, lyric: 'so-' },
  { note: 'G4', duration: 0.5, lyric: 'la-' },
  { note: 'F4', duration: 1.0, lyric: 'tion' },
  { note: '--', duration: 0.5 }, // Rest
  
  // "And it looks like I'm the queen"
  { note: 'D4', duration: 0.5, lyric: 'And' },
  { note: 'F4', duration: 0.5, lyric: 'it' },
  { note: 'G4', duration: 0.5, lyric: 'looks' },
  { note: 'A4', duration: 0.5, lyric: 'like' },
  { note: 'Bb4', duration: 0.5, lyric: "I'm" },
  { note: 'A4', duration: 0.5, lyric: 'the' },
  { note: 'G4', duration: 1.5, lyric: 'queen' },
  { note: '--', duration: 1.0 }, // Rest
  
  // "The wind is howling like this swirling storm inside"
  { note: 'F4', duration: 0.5, lyric: 'The' },
  { note: 'G4', duration: 0.5, lyric: 'wind' },
  { note: 'A4', duration: 0.5, lyric: 'is' },
  { note: 'Bb4', duration: 0.5, lyric: 'howl-' },
  { note: 'C5', duration: 0.5, lyric: 'ing' },
  { note: 'Bb4', duration: 0.5, lyric: 'like' },
  { note: 'A4', duration: 0.5, lyric: 'this' },
  { note: 'G4', duration: 0.5, lyric: 'swirl-' },
  { note: 'F4', duration: 0.5, lyric: 'ing' },
  { note: 'G4', duration: 0.5, lyric: 'storm' },
  { note: 'A4', duration: 0.5, lyric: 'in-' },
  { note: 'F4', duration: 1.0, lyric: 'side' },
  { note: '--', duration: 1.0 }, // Rest
  
  // "Couldn't keep it in, heaven knows I've tried"
  { note: 'F4', duration: 0.5, lyric: 'Could-' },
  { note: 'G4', duration: 0.5, lyric: "n't" },
  { note: 'A4', duration: 0.5, lyric: 'keep' },
  { note: 'Bb4', duration: 0.5, lyric: 'it' },
  { note: 'C5', duration: 0.5, lyric: 'in' },
  { note: '--', duration: 0.5 }, // Rest
  { note: 'Bb4', duration: 0.5, lyric: 'hea-' },
  { note: 'A4', duration: 0.5, lyric: 'ven' },
  { note: 'G4', duration: 0.5, lyric: 'knows' },
  { note: 'A4', duration: 0.5, lyric: "I've" },
  { note: 'F4', duration: 1.5, lyric: 'tried' },
  { note: '--', duration: 1.0 }, // Rest
  
  // "Don't let them in, don't let them see"
  { note: 'C4', duration: 0.5, lyric: "Don't" },
  { note: 'D4', duration: 0.5, lyric: 'let' },
  { note: 'F4', duration: 0.5, lyric: 'them' },
  { note: 'G4', duration: 0.5, lyric: 'in' },
  { note: '--', duration: 0.5 }, // Rest
  { note: 'C4', duration: 0.5, lyric: "don't" },
  { note: 'D4', duration: 0.5, lyric: 'let' },
  { note: 'F4', duration: 0.5, lyric: 'them' },
  { note: 'G4', duration: 1.0, lyric: 'see' },
  { note: '--', duration: 0.5 }, // Rest
  
  // "Be the good girl you always have to be"
  { note: 'C4', duration: 0.5, lyric: 'Be' },
  { note: 'D4', duration: 0.5, lyric: 'the' },
  { note: 'F4', duration: 0.5, lyric: 'good' },
  { note: 'G4', duration: 0.5, lyric: 'girl' },
  { note: 'A4', duration: 0.5, lyric: 'you' },
  { note: 'Bb4', duration: 0.5, lyric: 'al-' },
  { note: 'A4', duration: 0.5, lyric: 'ways' },
  { note: 'G4', duration: 0.5, lyric: 'have' },
  { note: 'F4', duration: 0.5, lyric: 'to' },
  { note: 'G4', duration: 1.5, lyric: 'be' },
  { note: '--', duration: 1.0 }, // Rest
  
  // "Conceal, don't feel, don't let them know"
  { note: 'C4', duration: 0.5, lyric: 'Con-' },
  { note: 'D4', duration: 0.5, lyric: 'ceal' },
  { note: '--', duration: 0.5 }, // Rest
  { note: 'F4', duration: 0.5, lyric: "don't" },
  { note: 'G4', duration: 0.5, lyric: 'feel' },
  { note: '--', duration: 0.5 }, // Rest
  { note: 'A4', duration: 0.5, lyric: "don't" },
  { note: 'Bb4', duration: 0.5, lyric: 'let' },
  { note: 'C5', duration: 0.5, lyric: 'them' },
  { note: 'A4', duration: 1.5, lyric: 'know' },
  { note: '--', duration: 1.0 }, // Rest
  
  // "Well, now they know!"
  { note: 'G4', duration: 0.5, lyric: 'Well' },
  { note: 'A4', duration: 0.5, lyric: 'now' },
  { note: 'Bb4', duration: 0.5, lyric: 'they' },
  { note: 'C5', duration: 2.0, lyric: 'know!' },
  { note: '--', duration: 1.0 }, // Rest
  
  // "Let it go, let it go"
  { note: 'F4', duration: 0.75, lyric: 'Let' },
  { note: 'G4', duration: 0.75, lyric: 'it' },
  { note: 'Ab4', duration: 1.5, lyric: 'go' },
  { note: '--', duration: 0.5 }, // Rest
  { note: 'F4', duration: 0.75, lyric: 'let' },
  { note: 'G4', duration: 0.75, lyric: 'it' },
  { note: 'Ab4', duration: 1.5, lyric: 'go' },
  { note: '--', duration: 0.5 }, // Rest
  
  // "Can't hold it back anymore"
  { note: 'F4', duration: 0.5, lyric: "Can't" },
  { note: 'G4', duration: 0.5, lyric: 'hold' },
  { note: 'Ab4', duration: 0.5, lyric: 'it' },
  { note: 'Bb4', duration: 0.5, lyric: 'back' },
  { note: 'C5', duration: 0.5, lyric: 'a-' },
  { note: 'Bb4', duration: 0.5, lyric: 'ny-' },
  { note: 'Ab4', duration: 1.5, lyric: 'more' },
  { note: '--', duration: 1.0 }, // Rest
  
  // "Let it go, let it go"
  { note: 'F4', duration: 0.75, lyric: 'Let' },
  { note: 'G4', duration: 0.75, lyric: 'it' },
  { note: 'Ab4', duration: 1.5, lyric: 'go' },
  { note: '--', duration: 0.5 }, // Rest
  { note: 'F4', duration: 0.75, lyric: 'let' },
  { note: 'G4', duration: 0.75, lyric: 'it' },
  { note: 'Ab4', duration: 1.5, lyric: 'go' },
  { note: '--', duration: 0.5 }, // Rest
  
  // "Turn away and slam the door"
  { note: 'F4', duration: 0.5, lyric: 'Turn' },
  { note: 'G4', duration: 0.5, lyric: 'a-' },
  { note: 'Ab4', duration: 0.5, lyric: 'way' },
  { note: 'Bb4', duration: 0.5, lyric: 'and' },
  { note: 'C5', duration: 0.5, lyric: 'slam' },
  { note: 'Bb4', duration: 0.5, lyric: 'the' },
  { note: 'Ab4', duration: 2.0, lyric: 'door' },
  { note: '--', duration: 1.0 }, // Rest
];

// Create the tone map
export const letItGoToneMap = createToneMapFromMelody(
  'let-it-go-frozen',
  'Let It Go',
  'Idina Menzel',
  letItGoMelody,
  120 // BPM
);

// Export individual sections for practice
export const letItGoSections = {
  verse1: {
    start: 0,
    end: letItGoMelody.slice(0, 32).reduce((sum, note) => sum + (note.duration * 500), 0),
    name: 'Verse 1'
  },
  preChorus: {
    start: letItGoMelody.slice(0, 32).reduce((sum, note) => sum + (note.duration * 500), 0),
    end: letItGoMelody.slice(0, 48).reduce((sum, note) => sum + (note.duration * 500), 0),
    name: 'Pre-Chorus'
  },
  chorus: {
    start: letItGoMelody.slice(0, 48).reduce((sum, note) => sum + (note.duration * 500), 0),
    end: letItGoMelody.reduce((sum, note) => sum + (note.duration * 500), 0),
    name: 'Chorus'
  }
};

// Key signature and vocal range information
export const letItGoInfo = {
  key: 'Ab Major',
  originalKey: 'Ab Major',
  timeSignature: '4/4',
  tempo: 120,
  vocalRange: {
    lowest: 'C4',
    highest: 'C5'
  },
  difficulty: 'Intermediate',
  sections: letItGoSections
};