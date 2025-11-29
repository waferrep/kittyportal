// Import the functions you need from the SDKs you need

  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
  
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAQHlm_y-fcsu_uTv6R8bDzqts1d-7iFp4",
    authDomain: "kittyportal-cad9d.firebaseapp.com",
    projectId: "kittyportal-cad9d",
    storageBucket: "kittyportal-cad9d.firebasestorage.app",
    messagingSenderId: "717971446158",
    appId: "1:717971446158:web:60466821b94d8a6947ecdf",
    measurementId: "G-DH8N25N9T8"
  };

  // Initialize Firebase
  export const app = initializeApp(firebaseConfig);
  export const analytics = getAnalytics(app);
  export const db = getFirestore(app);


