import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNeedBwkLS_U0a048mZ233DSM-bMh789U",
  authDomain: "streamfusion-app.firebaseapp.com",
  databaseURL: "https://streamfusion-app-default-rtdb.firebaseio.com",
  projectId: "streamfusion-app",
  storageBucket: "streamfusion-app.firebasestorage.app",
  messagingSenderId: "1023470476009",
  appId: "1:1023470476009:web:f398cd8daf7cf55b782e78",
  measurementId: "G-35C7CJHLKB",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable offline persistence for better performance and reliability
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export default app;
