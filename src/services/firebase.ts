
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
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from "firebase/storage";
import { connectAuthEmulator } from "firebase/auth";
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

const shouldUseEmulators =
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true" &&
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

if (shouldUseEmulators) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  console.log("Firebase: Emuladores activados (Firestore/Auth/Storage).");
}

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
