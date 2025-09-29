# Pitch Karaoke - Clean React Architecture

A professional React Native application for real-time pitch detection and karaoke practice.

## Architecture Overview

This application follows a clean MVC-like architecture with clear separation of concerns:

```
src/
├── models/           # Data models and business logic
├── services/         # External service integrations
├── controllers/      # Business logic controllers
├── views/           # Main application views
├── components/      # Reusable UI components
└── App.jsx         # Main application component
```

## Core Components

### Models
- **Song.js** - Core song data structure with timeline segments
- **PitchData.js** - Pitch detection result data and analysis utilities

### Services
- **AudioService.js** - Audio playback and recording management
- **PitchDetectionService.js** - Real-time pitch detection from microphone
- **StorageService.js** - Persistent data storage management
- **AnalysisService.js** - Song analysis via API or direct audio processing
- **AudioAnalysisService.js** - Direct Web Audio API analysis

### Controllers
- **SongController.js** - Song management and business logic
- **PracticeController.js** - Practice session coordination and statistics

### Views
- **PracticeView.jsx** - Main karaoke practice interface
- **SongLibraryView.jsx** - Song browsing and management

### Components
- **PitchVisualization.jsx** - Real-time pitch comparison display
- **ControlPanel.jsx** - Practice session controls
- **SongTimeline.jsx** - Song structure and navigation
- **PracticeStats.jsx** - Performance statistics display

## Key Features

### ✅ Real-time Pitch Detection
- Web Audio API integration for browser environments
- Real-time autocorrelation-based pitch detection
- Visual feedback with accuracy scoring

### ✅ Song Analysis
- Support for MP3 audio file analysis
- API integration for server-side processing
- Direct client-side analysis using Web Audio API
- Complete instrumental + vocal part detection

### ✅ Practice Management
- Session tracking with performance statistics
- Timeline-based navigation
- Visual pitch comparison
- Accuracy scoring and feedback

### ✅ Data Persistence
- Local storage of analyzed songs
- Song library management
- User settings and preferences

## Usage

### Import Analyzed Songs
```javascript
import { SongController } from './controllers/SongController';

const songController = new SongController();
await songController.importSongFromAnalysis(jsonAnalysisData);
```

### Start Practice Session
```javascript
import { PracticeController } from './controllers/PracticeController';

const practiceController = new PracticeController(songController);
await practiceController.initialize();
await practiceController.startPractice(filePath);
```

### Real-time Pitch Detection
```javascript
import { PitchDetectionService } from './services/PitchDetectionService';

const pitchService = new PitchDetectionService();
await pitchService.initialize();
pitchService.start((pitchData) => {
  console.log(`Detected: ${pitchData.getNoteString()} at ${pitchData.frequency}Hz`);
});
```

## Integration

The application integrates with:
- **Analysis API** (analysis-api/server.js) for server-side audio processing
- **Web Audio API** for real-time pitch detection and audio playback
- **AsyncStorage** for persistent data storage
- **Expo Audio** for mobile audio management

## Performance

- **Clean Architecture**: Separation of concerns for maintainability
- **Memory Management**: Proper cleanup of audio resources
- **Real-time Processing**: Optimized pitch detection with configurable parameters
- **Responsive UI**: Smooth animations and user feedback

## Security

- **No Demo Code**: All test/mock functionality removed
- **Input Validation**: Proper validation of imported data
- **Error Handling**: Comprehensive error handling and user feedback
- **Resource Cleanup**: Proper disposal of audio contexts and resources