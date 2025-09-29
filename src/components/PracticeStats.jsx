/**
 * Practice Stats Component - Shows real-time practice statistics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PracticeStats = ({ stats }) => {
  const { totalNotes = 0, correctNotes = 0, accuracy = 0 } = stats || {};

  /**
   * Get accuracy color based on percentage
   */
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4CAF50'; // Green
    if (accuracy >= 75) return '#FF9800'; // Orange
    if (accuracy >= 60) return '#FF5722'; // Red-Orange
    return '#f44336'; // Red
  };

  /**
   * Get performance grade
   */
  const getGrade = (accuracy) => {
    if (accuracy >= 95) return 'A+';
    if (accuracy >= 90) return 'A';
    if (accuracy >= 85) return 'A-';
    if (accuracy >= 80) return 'B+';
    if (accuracy >= 75) return 'B';
    if (accuracy >= 70) return 'B-';
    if (accuracy >= 65) return 'C+';
    if (accuracy >= 60) return 'C';
    return 'D';
  };

  /**
   * Get performance message
   */
  const getPerformanceMessage = (accuracy) => {
    if (accuracy >= 95) return 'Perfect! 🌟';
    if (accuracy >= 90) return 'Excellent! 🎉';
    if (accuracy >= 80) return 'Great job! 👏';
    if (accuracy >= 70) return 'Good work! 👍';
    if (accuracy >= 60) return 'Keep practicing! 💪';
    return 'Keep trying! 🎵';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice Stats</Text>
      
      <View style={styles.statsGrid}>
        
        {/* Accuracy */}
        <View style={styles.statBox}>
          <Text style={[
            styles.statValue, 
            { color: getAccuracyColor(accuracy) }
          ]}>
            {Math.round(accuracy)}%
          </Text>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.grade}>{getGrade(accuracy)}</Text>
        </View>
        
        {/* Correct Notes */}
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{correctNotes}</Text>
          <Text style={styles.statLabel}>Correct Notes</Text>
        </View>
        
        {/* Total Notes */}
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalNotes}</Text>
          <Text style={styles.statLabel}>Total Notes</Text>
        </View>
        
      </View>
      
      {/* Performance Message */}
      {totalNotes > 5 && (
        <View style={styles.messageContainer}>
          <Text style={styles.performanceMessage}>
            {getPerformanceMessage(accuracy)}
          </Text>
        </View>
      )}
      
      {/* Progress Bar */}
      {totalNotes > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Accuracy Progress
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(accuracy, 100)}%`,
                  backgroundColor: getAccuracyColor(accuracy)
                }
              ]} 
            />
          </View>
        </View>
      )}
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 2,
  },
  grade: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  performanceMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
});