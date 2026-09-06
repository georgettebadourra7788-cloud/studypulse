import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useStudies(uid) {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "studies"), where("ownerId", "==", uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setStudies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  return { studies, loading };
}
