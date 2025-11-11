import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  useWindowDimensions 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseConfig';
import { Post } from '../../types'
import Icon from 'react-native-vector-icons/Feather';
import { decode } from 'base64-arraybuffer';

export default function Profile() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const fetchUserPosts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPosts(data as Post[]);
    } catch (error: any) {
      setError(error.message || 'Failed to load posts');
      Alert.alert(
        'Error Loading Posts',
        error.message || 'Could not load your posts. Please check your connection.',
        [
          { text: 'Retry', onPress: () => fetchUserPosts() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
      
      const subscription = supabase
        .channel('user_posts_channel')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'posts',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchUserPosts();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeProfilePicture = async () => {
    if (!user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploadingPhoto(true);

    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64Content = base64data.split(',')[1];
          resolve(base64Content);
        };
        reader.readAsDataURL(blob);
      });

      const fileExt = 'jpg';
      const fileName = `${user.id}/profile/avatar.${fileExt}`;

      try {
        await supabase.storage
          .from('post-images')
          .remove([fileName]);
      } catch (deleteError) {
      console.log(deleteError)
      }

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      const { error: updateUserError } = await supabase
        .from('users')
        .update({ 
          photo_url: urlData.publicUrl
        })
        .eq('id', user.id);

      if (updateUserError) throw updateUserError;

      const { error: updatePostsError } = await supabase
        .from('posts')
        .update({ 
          user_avatar: urlData.publicUrl
        })
        .eq('user_id', user.id);

      if (updatePostsError) {
      }

      Alert.alert('Success', 'Profile picture updated!');
      
      setTimeout(() => {
        fetchUserPosts();
      }, 1000);
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update profile picture: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const renderPost = ({ item }: { item: Post }) => {
    return (
      <View style={styles.gridItem}>
        <View style={[styles.postContainer,{ 
          maxWidth: isLargeScreen ? 223 : 150,
          maxHeight: isLargeScreen ? 226 : 158 
        }]}>
          {item.image_url ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.gridImage}
              />
            </View>
          ) : (
            <View style={styles.gridPlaceholder}>
              <Text style={styles.gridPlaceholderText} numberOfLines={3}>
                {item.content}
              </Text>
            </View>
          )}
          {item.content && item.image_url && (
            <View style={styles.textContainer}>
              <Text style={styles.postText} numberOfLines={2}>
                {item.content}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!user && loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserPosts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out" color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {user?.photo_url ? (
              <Image
                source={{ 
                  uri: `${user.photo_url}?t=${Date.now()}`
                }}
                style={styles.profileImage}
              />
            ) : null}
            
            <View style={styles.fallbackAvatar}>
              <Text style={styles.fallbackText}>
                {user?.display_name?.substring(0, 2).toUpperCase() || 'US'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.editPhotoButton}
              onPress={changeProfilePicture}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="camera" color="#FFFFFF" size={16} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.displayName}>{user.display_name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          
          <View style={styles.postsCountContainer}>
            <Text style={styles.postsCount}>{posts.length}</Text>
            <Text style={styles.postsCountLabel}>Posts</Text>
          </View>
        </View>

        <View style={styles.postsHeader}>
          <Text style={styles.postsTitle}>Your Posts</Text>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Start sharing your moments!</Text>
            </View>
          }
        />
      </View>

      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.logoutButton]}
                onPress={() => {
                  setShowLogoutModal(false);
                  logout().catch((error: any) => {
                    Alert.alert('Error', error.message);
                  });
                }}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 700,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  fallbackAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8B5CF6',
    position: 'absolute',
    zIndex: -1,
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  postsCountContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 16,
  },
  postsCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginRight: 8,
  },
  postsCountLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  postsHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  gridContainer: {
    padding: 2,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
  },
  postContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageContainer: {
    flex: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    minHeight: 10,
    justifyContent: 'center',
  },
  postText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 19,
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  gridPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    width: '100%',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});