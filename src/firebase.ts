import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";

const firebaseConfig = {
  projectId: "smartclinic-11971",
  appId: "1:301262646979:web:73dc5a1a7af60f5e5a7c76",
  apiKey: "AIzaSyDWr5lA9QgmKZLl5M8ctDKQWqS7yOFn_LY",
  authDomain: "smartclinic-11971.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-discstat-440b7a7f-11e0-4d73-b6ff-200714911486",
  storageBucket: "smartclinic-11971.firebasestorage.app",
  messagingSenderId: "301262646979"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

// Generic function to sync a collection with automatic local storage seeding
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  getLocalBackup: () => T[]
) {
  const colRef = collection(db, collectionName);
  let isInitialized = false;

  return onSnapshot(colRef, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as T);
    });

    if (!isInitialized) {
      isInitialized = true;
      // If Firestore has 0 documents but local storage has data, seed Firestore!
      if (items.length === 0) {
        const localItems = getLocalBackup();
        if (localItems.length > 0) {
          console.log(`Seeding collection ${collectionName} with local data:`, localItems);
          const batch = writeBatch(db);
          localItems.forEach((item) => {
            const docRef = doc(db, collectionName, item.id);
            batch.set(docRef, item);
          });
          batch.commit().catch(err => console.error(`Error seeding ${collectionName}:`, err));
          onUpdate(localItems);
          return;
        }
      }
    }

    onUpdate(items);
  }, (error) => {
    console.error(`Error syncing ${collectionName}:`, error);
  });
}

// Single item set
export async function saveDocument(collectionName: string, id: string, data: any) {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Error saving document in ${collectionName}:`, error);
    throw error;
  }
}

// Single item delete
export async function deleteDocument(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}
