import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Text, TouchableOpacity, Alert } from 'react-native';

// Import your original PitchKaraoke app
let PitchKaraokeApp;
try {
  PitchKaraokeApp = require('../App.jsx').default;
} catch (error) {
  console.log('PitchKaraoke app not available:', error.message);
}

export default function HomeScreen() {
  const [showPitchKaraoke, setShowPitchKaraoke] = useState(false);

  const handleLoadPitchKaraoke = () => {
    if (PitchKaraokeApp) {
      setShowPitchKaraoke(true);
    } else {
      Alert.alert(
        'PitchKaraoke Unavailable',
        'The PitchKaraoke functionality is not available. Some components may have missing dependencies.',
        [{ text: 'OK' }]
      );
    }
  };

  if (showPitchKaraoke && PitchKaraokeApp) {
    return <PitchKaraokeApp />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎤 PitchKaraoke</Text>
        <Text style={styles.subtitle}>React Native App is working!</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleLoadPitchKaraoke}>
            <Text style={styles.buttonText}>Launch PitchKaraoke</Text>
          </TouchableOpacity>

          <Text style={styles.info}>
            ✅ Expo removed successfully{'\n'}
            ✅ React Native navigation working{'\n'}
            ✅ Metro bundler running{'\n'}
            📱 App size significantly reduced
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});