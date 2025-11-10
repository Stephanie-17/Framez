export interface User {
  id: string;
  email: string;
  display_name: string;
  photo_url?: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  image_url?: string;
  likes: number;
  liked_by: string[];
  created_at: string;
}