import { useState, useEffect } from 'react'
import { Firebase, db } from 'src/configs/firebase'
import { query, collection, onSnapshot } from 'firebase/firestore'

export const useSnapshot = () => {

  const [data, setData] = useState([]);

useEffect(() => {
  const q = query(collection(db, "solicitudes"));
  onSnapshot(q, (querySnapshot) => {
    const allDocs = [];
    querySnapshot.forEach((doc) => {
      allDocs.push({...doc.data(), id:doc.id});
  });
    setData(allDocs)
});

}, [])

return data
}
