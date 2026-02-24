
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  type Auth,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import {
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";
import { firebaseConfig } from "../config/firebase.config";

// Initialize the Firebase app, using existing app if one exists
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with a persistent local cache and tab synchronization
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Export the service instances
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Optional anonymous sign‑in
let authInitialized = false;
export const initializeAuth = async () => {
  if (authInitialized) return;
  try {
    await signInAnonymously(auth);
    authInitialized = true;
    console.log("Firebase: Signed in anonymously successfully.");
  } catch (error) {
    console.error("Firebase: Anonymous sign-in failed.");
    throw error;
  }
};
