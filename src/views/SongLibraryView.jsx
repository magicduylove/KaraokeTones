/**
 * Song Library View - Browse and manage analyzed songs
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  RefreshControl 
} from 'react-native';

export const SongLibraryView = ({ 
  songController, 
  onSongSelected, 
  onClose 
}) => {
  const [songList, setSongList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState(null);

  // Load song list on mount
  useEffect(() => {
    loadSongs();
  }, []);

  /**
   * Load songs from storage
   */
  const loadSongs = async () => {
    try {
      setLoading(true);
      const songs = await songController.loadSongList();
      setSongList(songs);
      
      // Set currently selected song
      const currentSong = songController.getCurrentSong();
      if (currentSong) {
        setSelectedSongId(currentSong.id);
      }
    } catch (error) {
      console.error('Failed to load songs:', error);
      Alert.alert('Error', 'Failed to load song library');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSongs();
    setRefreshing(false);
  };

  /**
   * Handle song selection
   */
  const handleSongSelect = async (song) => {
    try {
      await songController.loadSong(song.id);
      setSelectedSongId(song.id);
      
      if (onSongSelected) {
        onSongSelected(song);
      }
      
      Alert.alert(
        'Song Loaded',
        `"${song.title}" is ready for practice!`,
        [
          { text: 'Start Practice', onPress: onClose },
          { text: 'Stay Here', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Failed to select song:', error);
      Alert.alert('Error', 'Failed to load selected song');
    }
  };

  /**
   * Handle song deletion
   */
  const handleDeleteSong = (song) => {
    Alert.alert(
      'Delete Song',
      `Are you sure you want to delete "${song.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await songController.deleteSong(song.id);
              await loadSongs();
              Alert.alert('Deleted', `"${song.title}" has been deleted.`);
            } catch (error) {
              console.error('Failed to delete song:', error);
              Alert.alert('Error', 'Failed to delete song');
            }
          }
        }
      ]
    );
  };

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Song Library</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading songs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 Song Library</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Song Count */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {songList.length} song{songList.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Song List */}
      {songList.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No songs imported yet</Text>
          <Text style={styles.emptySubtext}>
            Use "Import Analysis" to add analyzed songs
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.songList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
            />
          }
        >
          {songList.map((song) => (
            <View
              key={song.id}
              style={[
                styles.songItem,
                selectedSongId === song.id && styles.selectedSongItem
              ]}
            >
              
              {/* Song Info */}
              <TouchableOpacity
                style={styles.songContent}
                onPress={() => handleSongSelect(song)}
                activeOpacity={0.7}
              >
                <View style={styles.songMainInfo}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                </View>
                
                <View style={styles.songMeta}>
                  <Text style={styles.songMetaText}>
                    ⏱️ {formatTime(song.duration)}
                  </Text>
                  <Text style={styles.songMetaText}>
                    🎵 {song.segmentCount} segments
                  </Text>
                  {song.analyzedAt && (
                    <Text style={styles.songMetaText}>
                      📅 {formatDate(song.analyzedAt)}
                    </Text>
                  )}
                </View>
                
                {selectedSongId === song.id && (
                  <View style={styles.currentIndicator}>
                    <Text style={styles.currentIndicatorText}>▶ CURRENT</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Actions */}
              <View style={styles.songActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteSong(song)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          ))}
        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  statsText: {
    color: '#ccc',
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  songList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  songItem: {
    backgroundColor: '#222',
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  selectedSongItem: {
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  songContent: {
    flex: 1,
    padding: 15,
  },
  songMainInfo: {
    marginBottom: 8,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  songArtist: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  songMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  songMetaText: {
    color: '#999',
    fontSize: 11,
    marginRight: 15,
    marginBottom: 2,
  },
  currentIndicator: {
    marginTop: 8,
  },
  currentIndicatorText: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: 'bold',
  },
  songActions: {
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});