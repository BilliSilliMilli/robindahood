// Firebase web configuration is public by design.
// Security comes from Firebase Authentication and authorized-domain rules.
export const firebaseConfig = {
  apiKey: "AIzaSyDfw1miJ05BbXyQVDR8QSFMDSjnkRqIlkM",
  authDomain: "robindahood-trading-dashboard.firebaseapp.com",
  projectId: "robindahood-trading-dashboard",
  storageBucket: "robindahood-trading-dashboard.firebasestorage.app",
  messagingSenderId: "951077250993",
  appId: "1:951077250993:web:0d473d4c019261486cff90",
  measurementId: "G-2ZHZJSW859"
};

// Only these signed-in emails may access the dashboard.
export const allowedEmails = [
  "bilalsmirza123@gmail.com"
];
