/**
 * Main Entry Point - Clean React Application
 */

export { default } from './App.jsx';

// Export clean API for external use
export { Song, PitchSegment } from './models/Song.js';
export { PitchData, PitchAnalysisResult } from './models/PitchData.js';
export { AudioService } from './services/AudioService.js';
export { PitchDetectionService } from './services/PitchDetectionService.js';
export { StorageService } from './services/StorageService.js';
export { AnalysisService } from './services/AnalysisService.js';
export { SongController } from './controllers/SongController.js';
export { PracticeController } from './controllers/PracticeController.js';