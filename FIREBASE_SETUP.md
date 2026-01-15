# Firebase Cloud Sync Setup

This application supports cloud synchronization using Firebase Firestore, allowing your data to be available across all your devices.

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard
4. Enable Firestore Database:
   - Go to "Firestore Database" in the left menu
   - Click "Create database"
   - Start in **test mode** (for development) or set up security rules for production
   - Choose a location for your database

### 2. Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. If you don't have a web app, click the `</>` icon to add one
5. Copy the Firebase configuration object

### 3. Configure in the Application

1. Click the "Cloud Sync" button in the header
2. Enter your Firebase configuration:
   - **API Key**: From your Firebase config
   - **Auth Domain**: Usually `your-project-id.firebaseapp.com`
   - **Project ID**: Your Firebase project ID
   - **Storage Bucket**: Usually `your-project-id.appspot.com`
   - **Messaging Sender ID**: From your Firebase config
   - **App ID**: From your Firebase config
3. Click "Enable Cloud Sync"

### 4. Security Rules (Important!)

For production use, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Or for simpler setup (less secure):
      // allow read, write: if true;
    }
  }
}
```

**Note**: The test mode rules allow all reads/writes for 30 days. For production, implement proper authentication or restrict access.

## How It Works

- **Automatic Sync**: When cloud sync is enabled, all changes are automatically saved to Firebase
- **Real-time Updates**: Changes made on one device appear on other devices in real-time
- **User ID**: Each installation gets a unique User ID stored locally
- **Fallback**: If cloud sync fails, data is still saved locally

## Data Structure

Data is stored in Firestore under:
```
users/{userId}
  - apartments: Array<Apartment>
  - lastUpdated: Timestamp
```

## Troubleshooting

- **Sync not working**: Check that all Firebase configuration fields are correct
- **Data not appearing**: Verify Firestore security rules allow read/write access
- **Connection issues**: The app will continue to work locally if cloud sync is unavailable
