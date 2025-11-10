import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabaseConfig';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';
import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';

export default function Create() {
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login' as any);
    }
  }, [user,router]);

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const base64 = decode(arrayBuffer as any);

      const uriParts = uri.split('.');
      const fileExt = uriParts[uriParts.length - 1].toLowerCase() || 'jpg';
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      let contentType = 'image/jpeg';
      if (fileExt === 'png') contentType = 'image/png';
      else if (fileExt === 'webp') contentType = 'image/webp';
      else if (fileExt === 'gif') contentType = 'image/gif';

      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, base64, {
          contentType,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !imageUri) {
      Alert.alert('Error', 'Please add some content or an image');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      if (imageUri) {
        console.log('Uploading image...');
        imageUrl = await uploadImage(imageUri);
        console.log('Image uploaded:', imageUrl);
      }

      const newPost = {
        user_id: user.id,
        user_name: user.display_name,
        user_avatar: user.photo_url,
        content: content.trim() || null,
        image_url: imageUrl,
        likes: 0,
        liked_by: [],
        created_at: new Date().toISOString(),
      };

      console.log('Creating post:', newPost);

      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Post created successfully:', data);
      
      setContent('');
      setImageUri(null);
      
      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: () => console.log('Post success acknowledged') }
      ]);
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to create post. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Post</Text>
          <Text style={styles.headerNote}>Supports: JPG, PNG, WebP, GIF</Text>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
          />

          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setImageUri(null)}
              >
                <Icon name="x" color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Icon name="image" color="#8B5CF6" size={24} />
              <Text style={styles.actionText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Icon name="camera" color="#8B5CF6" size={24} />
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.postButton, loading && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerNote: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  postButton: {
    backgroundColor: '#8B5CF6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});