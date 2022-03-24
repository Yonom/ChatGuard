import { initializeApp } from "https://jspm.dev/@firebase/app"
import {
    getFirestore,
    getDocs,
    onSnapshot,
} from "https://jspm.dev/@firebase/firestore"
import { getAuth, signInAnonymously } from "https://jspm.dev/@firebase/auth"

import { useEffect, useState, ComponentType } from "react"

const firebaseConfig = {
    // <snipped>
}

const app = initializeApp(firebaseConfig)
export const firestore = getFirestore(app)
export const auth = getAuth(app)

signInAnonymously(auth)

export const useCollection = (query: any) => {
    const [value, setValue] = useState<any>()

    useEffect(() => {
        const unsubscribe = onSnapshot(query, (querySnapshot) => {
            setValue(
                querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            )
        })
        return unsubscribe
    }, [])

    return [value]
}
