/**
 * Main App Component - Clean React architecture
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Modal } from 'react-native';
import { PracticeView } from './views/PracticeView.jsx';
import { SongLibraryView } from './views/SongLibraryView.jsx';
import { SongController } from './controllers/SongController.js';
import { PracticeController } from './controllers/PracticeController.js';

export default function App() {
  const [showSongLibrary, setShowSongLibrary] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Controllers - using refs to maintain instances
  const songControllerRef = useRef(null);
  const practiceControllerRef = useRef(null);

  /**
   * Initialize application
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize controllers
        songControllerRef.current = new SongController();
        practiceControllerRef.current = new PracticeController(songControllerRef.current);

        // Initialize song controller
        await songControllerRef.current.initialize();

        setIsInitialized(true);
        console.log('✅ Application initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        Alert.alert(
          'Initialization Error',
          'Failed to initialize the application. Please restart the app.',
          [{ text: 'OK' }]
        );
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      if (practiceControllerRef.current) {
        practiceControllerRef.current.cleanup().catch(console.error);
      }
      if (songControllerRef.current) {
        songControllerRef.current.cleanup();
      }
    };
  }, []);

  /**
   * Handle song import from analysis JSON
   */
  const handleImportSong = async (analysisJSON) => {
    try {
      const song = await songControllerRef.current.importSongFromAnalysis(analysisJSON);
      console.log('✅ Song imported successfully:', song.title);
      return song;
    } catch (error) {
      console.error('❌ Failed to import song:', error);
      throw error;
    }
  };

  /**
   * Handle song selection from library
   */
  const handleSongSelected = (song) => {
    console.log('✅ Song selected:', song.title);
    setShowSongLibrary(false);
  };

  /**
   * Open song library
   */
  const handleOpenSongLibrary = () => {
    setShowSongLibrary(true);
  };

  /**
   * Close song library
   */
  const handleCloseSongLibrary = () => {
    setShowSongLibrary(false);
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        {/* You could add a loading spinner here */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Main Practice Interface */}
      <PracticeView
        practiceController={practiceControllerRef.current}
        songController={songControllerRef.current}
        onImportSong={handleImportSong}
        onSelectSong={handleOpenSongLibrary}
      />

      {/* Song Library Modal */}
      <Modal
        visible={showSongLibrary}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SongLibraryView
          songController={songControllerRef.current}
          onSongSelected={handleSongSelected}
          onClose={handleCloseSongLibrary}
        />
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});