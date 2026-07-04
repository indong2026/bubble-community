import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  onSnapshot,
  where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDf6KA0FacMPeS97xZnKU68xjXyeK88fik",
  authDomain: "bubble-community-a4305.firebaseapp.com",
  projectId: "bubble-community-a4305",
  storageBucket: "bubble-community-a4305.firebasestorage.app",
  messagingSenderId: "250606226195",
  appId: "1:250606226195:web:b54a86e223e6173e2868e6",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot };


