import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useStudy(studyId) {
  const [study, setStudy] = useState(undefined); // undefined = loading, null = not found
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    if (!studyId) return;
    const unsubStudy = onSnapshot(doc(db, "studies", studyId), (snap) => {
      setStudy(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });

    const uploadsQuery = query(collection(db, "studies", studyId, "uploads"), orderBy("uploadedAt", "desc"));
    const unsubUploads = onSnapshot(uploadsQuery, (snap) => {
      setUploads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubStudy();
      unsubUploads();
    };
  }, [studyId]);

  return { study, uploads };
}
