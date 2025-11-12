# Framez - Social Media App

Framez is a mobile social application built with React Native and Expo that allows users to share posts with text and images. Built for the HNG 13 Frontend Track Stage Four submission.

## 🚀 Features

- **Authentication**: Secure signup, login, and logout with Supabase
- **Posts**: Create posts with text and/or images
- **Real-time Feed**: Chronological feed of all posts with automatic updates
- **User Profiles**: View your profile with all your posts
- **Image Upload**: Upload profile pictures and post images
- **Responsive Design**: Clean, Instagram-inspired UI that works on all screen sizes

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo
- **Backend**: Supabase (Authentication & Database)
- **Storage**: Supabase Storage for images
- **State Management**: React Context API
- **Navigation**: Expo Router

## 📱 Screens

- **Feed**: View posts from all users in real-time
- **Create**: Create new posts with text and images
- **Profile**: View your profile, posts, and update profile picture

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd framez
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go (Android) or Camera (iOS)
   - Or press `i` for iOS simulator / `a` for Android emulator

## 🔧 Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Enable Authentication with Email
3. Create a `posts` table:
   ```sql
   CREATE TABLE posts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     user_name TEXT,
     user_avatar TEXT,
     content TEXT,
     image_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
4. Create a `users` table:
   ```sql
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     display_name TEXT,
     email TEXT,
     photo_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
5. Create a storage bucket called `post-images` with public access

## 📁 Project Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # Feed screen
│   ├── create.tsx         # Create post screen
│   └── profile.tsx        # Profile screen
├── auth/
│   ├── login.tsx          # Login screen
│   └── register.tsx       # Register screen
├── _layout.tsx            # Root layout with auth guard
├── context/
│   └── AuthContext.tsx    # Authentication context
└── services/
    └── supabaseConfig.ts  # Supabase configuration
```

## 🎨 Key Features Implemented

### Authentication
- Email/password registration and login
- Persistent sessions
- Protected routes
- Automatic redirect based on auth state

### Posts
- Create posts with text and images
- Real-time post updates
- Chronological feed
- Author information and timestamps

### Profile
- User information display
- Post history
- Profile picture upload
- Post count

### UI/UX
- Responsive grid layout for posts
- Loading states and error handling
- Pull-to-refresh functionality
- Custom modals and alerts

## 📲 Deployment

The app is deployed on [Appetize.io](your-appetize-link) for testing on both iOS and Android devices.


## 👥 Development

This project was developed as part of the HNG 13 Frontend Track Stage Four requirements.

## 📄 License

This project is for educational purposes as part of the HNG Internship program.