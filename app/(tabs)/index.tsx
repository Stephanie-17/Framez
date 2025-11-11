import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabaseConfig';
import { Post } from '../../types';


export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  

  useEffect(() => {
    fetchPosts();

    const subscription = supabase
      .channel('posts_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data as Post[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
  

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

 const renderPost = ({ item }: { item: Post }) => {
  console.log('👤 [FEED DEBUG] Post user:', {
  userName: item.user_name,
  userAvatar: item.user_avatar,
  hasAvatar: !!item.user_avatar
});
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
      <Image
  source={{ 
    uri: item.user_avatar 
      ? `${item.user_avatar}?t=${Date.now()}` // Add cache busting
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user_name || 'User')}&size=80&background=8B5CF6&color=fff`
  }}
  style={styles.avatar}
/>
        <View style={styles.postHeaderText}>
          <Text style={styles.userName}>{item.user_name}</Text>
          <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
        </View>
      </View>

      {item.content && (
        <View style={styles.postContentTop}>
          <Text style={styles.contentText}>
            {item.content}
          </Text>
        </View>
      )}

      {item.image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.postImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('🖼️ [FEED] Load error for:', item.id,error);
            }}
          />
        </View>
      )}
    </View>
  );
};

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Framez</Text>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B5CF6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            </View>
          }
        />
      </View>
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
  },
  header: {
    width: '100%',
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
    color: '#8B5CF6',
  },
  feedContainer: {
    paddingVertical: 8,
     paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  postHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  postContentTop: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 400,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
  postImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#F3F4F6',
    borderRadius:10
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  likedText: {
    color: '#EF4444',
  },
  contentText: {
    fontSize: 17,
    color: '#1F2937',
    lineHeight: 20,
    marginStart: 50
  },
  contentUserName: {
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
});