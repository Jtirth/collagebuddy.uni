// Firebase Configuration (Compat Mode)
const firebaseConfig = {
    apiKey: "AIzaSyALsuj4eygOF9y8k7mbwSGm60iu3d75cZI",
    authDomain: "study-buddy-71ae7.firebaseapp.com",
    projectId: "study-buddy-71ae7",
    storageBucket: "study-buddy-71ae7.firebasestorage.app",
    messagingSenderId: "476257536150",
    appId: "1:476257536150:web:8d0cf10f15fff4e33fdab7",
    measurementId: "G-E99T399YCL"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export Auth and Firestore for use in other files
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics ? firebase.analytics() : null;

console.log("Firebase Initialized:", firebaseConfig.projectId);
