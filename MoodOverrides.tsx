import { ComponentType, useEffect, useState, useRef } from "react"
import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"
import { randomColor } from "https://framer.com/m/framer/utils.js@^0.9.0"
import {
    Timestamp,
    where,
    query,
    orderBy,
    limit,
    collection,
    doc,
    getDoc,
    setDoc,
} from "https://jspm.dev/@firebase/firestore"
import { firestore, useCollection, auth } from "./firebase.ts"
import { getAboveThreshold } from "./ChatOverrides.tsx"

const useStore = createStore({
    moodWarningVisible: false,
    moodWarningPredictionLabel: "toxic",
    moodWraningIsAgressor: false,
})

type MoodObj = {
    mood: 0 | -1 | -2 | -3
    updated_at: Timestamp
}

function getMood(obj?: MoodObj) {
    const TIMEOUT = 1000 * 60
    if (!obj || new Date().getTime() - obj.updated_at.toMillis() > TIMEOUT) {
        return 0
    }
    return obj.mood
}
function getMoodString(obj?: MoodObj) {
    const mood = getMood(obj)

    if (mood === -1) {
        return "Sad"
    }
    if (mood <= -2) {
        return "VerySad"
    }
    return "Neutral"
}

export const useMyMoodTapHandler = (chat, offset: 1 | -1) => {
    const [, setStore] = useStore()
    const handleTap = async () => {
        const user_id = auth.currentUser?.uid
        if (!user_id) return
        const ref = doc(firestore, "moods", user_id)
        const prevData = await getDoc(ref)
        const mood = getMood(prevData.data())

        const targetMood = mood + offset
        const predictionMood =
            getAboveThreshold(chat.prediction ?? {}, 0.8)?.[0] ?? "toxic"
        if (targetMood < -2) {
            setStore({
                moodWarningVisible: true,
                moodWarningPredictionLabel: predictionMood,
                moodWraningIsAgressor: false,
            })
        }

        await setDoc(ref, {
            mood: Math.min(0, Math.max(-3, targetMood)),
            user_id,
            updated_at: new Date(),
            predictionMood: predictionMood,
        })
    }
    return handleTap
}

export function withCharacter(Component): ComponentType {
    return (props) => {
        const character =
            (auth.currentUser?.uid ?? "").charCodeAt(10) % 2 === 0
                ? "Manya"
                : "Adrien"

        // refresh every 10 sec in case user changes
        const [, refresh] = useState({})
        useEffect(() => {
            setTimeout(() => {
                refresh({})
            }, 10000)
        })

        return <Component {...props} text={character} />
    }
}

export function withMood(Component): ComponentType {
    return (props) => {
        const [, setStore] = useStore()
        const [moodObjects] = useCollection(
            query(
                collection(firestore, "moods"),
                orderBy("updated_at", "desc"),
                limit(2)
            )
        )

        const moodObj = moodObjects?.filter(
            (o) => o.user_id !== auth.currentUser?.uid
        )[0]
        const mood = getMood(moodObj)
        const moodStr = getMoodString(moodObj)

        const lastMood = useRef(mood)
        useEffect(() => {
            if (lastMood.current !== -3 && mood === -3) {
                console.log({ mood, lastMood })
                setStore({
                    moodWarningVisible: true,
                    moodWarningPredictionLabel: moodObj.prediction,
                    moodWraningIsAgressor: true,
                })
            }
            lastMood.current = mood
        })

        const character =
            (auth.currentUser?.uid ?? "").charCodeAt(10) % 2 === 0
                ? "Manya"
                : "Adrien"

        // refresh mood every 10 sec in case it expires
        const [, refresh] = useState({})
        useEffect(() => {
            if (!mood) return
            setTimeout(() => {
                refresh({})
            }, 10000)
        })

        return <Component {...props} variant={moodStr + character} />
    }
}

export function withMoodWarning(Component): ComponentType {
    return (props) => {
        const [store, setStore] = useStore()
        const handleClose = () => {
            setStore({ moodWarningVisible: false })
        }
        return (
            <Component
                {...props}
                style={{
                    display: store.moodWarningVisible ? undefined : "none",
                }}
                close={handleClose}
                variant={
                    store.moodWraningIsAgressor
                        ? "Educational"
                        : store.moodWarningPredictionLabel === "obscene"
                        ? "Obscene"
                        : "Primary"
                }
            />
        )
    }
}
