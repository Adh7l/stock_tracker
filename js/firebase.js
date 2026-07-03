// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDSO3oYvVKK-OHO6zT0Y4ezTSZUKT1i_KU",
    authDomain: "city-dairy-stock-9dac8.firebaseapp.com",
    projectId: "city-dairy-stock-9dac8",
    storageBucket: "city-dairy-stock-9dac8.firebasestorage.app",
    messagingSenderId: "929241195817",
    appId: "1:929241195817:web:cea0ccb68768e5c7d4c338"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();