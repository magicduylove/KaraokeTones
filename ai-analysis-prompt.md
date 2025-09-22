# AI Music Analysis Prompt

## Prompt for AI Music Analysis Service

```
Analyze this Vietnamese song audio file and extract vocal melody data for karaoke practice.

TASK: Create a detailed pitch timeline for the main vocal line

REQUIREMENTS:
1. Focus only on the lead vocal melody (ignore backing vocals, instruments)
2. Detect pitch changes with 0.1-second precision
3. Convert all frequencies to standard musical note names (C4, D4, E4, F#4, etc.)
4. Provide confidence scores for each detected segment
5. Identify vocal sections vs instrumental sections
6. Detect song structure (intro, verse, chorus, bridge, outro)

OUTPUT FORMAT (JSON):
{
  "songInfo": {
    "title": "Song Title Here",
    "artist": "Artist Name", 
    "duration": 180.5,
    "key": "C Major",
    "bpm": 75,
    "language": "vietnamese",
    "genre": "ballad"
  },
  "pitchTimeline": [
    {
      "startTime": 12.5,
      "endTime": 14.2,
      "note": "C4",
      "frequency": 261.63,
      "confidence": 0.95,
      "isVocal": true,
      "section": "verse1"
    },
    {
      "startTime": 14.2,
      "endTime": 16.8,
      "note": "D4",
      "frequency": 293.66,
      "confidence": 0.88,
      "isVocal": true,
      "section": "verse1"
    }
  ],
  "songStructure": {
    "intro": { "start": 0, "end": 10, "description": "instrumental" },
    "verse1": { "start": 10, "end": 45, "description": "main verse" },
    "chorus": { "start": 45, "end": 75, "description": "chorus section" },
    "verse2": { "start": 75, "end": 110, "description": "second verse" },
    "bridge": { "start": 110, "end": 130, "description": "bridge section" },
    "outro": { "start": 130, "end": 180, "description": "ending" }
  },
  "vocalRange": {
    "lowest": "A3",
    "highest": "F5",
    "lowestFreq": 220.0,
    "highestFreq": 698.46
  },
  "analysisMetadata": {
    "analyzedAt": "2024-01-15T10:30:00Z",
    "method": "AI_vocal_separation",
    "accuracy": 0.92,
    "processingTime": 45.2
  }
}

VIETNAMESE SONG SPECIFIC REQUIREMENTS:
- Account for Vietnamese tonal language patterns
- Focus on typical Vietnamese vocal range (A3-G5)
- Identify common Vietnamese song structures
- Handle vibrato and vocal ornaments common in Vietnamese music
- Separate main melody from traditional instrument accompaniment

PRECISION REQUIREMENTS:
- Minimum segment duration: 0.2 seconds
- Timing accuracy: ±0.05 seconds
- Frequency accuracy: ±2 Hz
- Only include segments with confidence > 0.7

Return only the JSON data with no additional explanations or markdown formatting.
```

## Example Usage

Send this prompt along with your MP3 file to:
- OpenAI GPT-4 with audio capabilities
- Specialized music AI services (AudioShake, LANDR, etc.)
- Custom music analysis APIs

## Expected File Size
- MP3 file should be under 10MB for most AI services
- Duration: typically works best with songs under 5 minutes
- Quality: 128kbps or higher recommended for accurate analysis