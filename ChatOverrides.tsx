import { useRef, useEffect, useState, ComponentType } from "react"
import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"

import {
    collection,
    addDoc,
    setDoc,
} from "https://jspm.dev/@firebase/firestore"
import { firestore, useCollection, auth } from "./firebase.ts"
import { useDebounce, predictToxicity } from "./utils.ts"

type PredictionType =
    | "toxic"
    | "severe_toxic"
    | "obscene"
    | "threat"
    | "insult"
    | "identity_hate"

type Predictions = {
    [type in PredictionType]: number
}

const PREDICTION_PRIORITIES = {
    severe_toxic: {
        prevent: "Your message can come across as severely toxic.",
    },
    threat: { prevent: "Your message can come across as being threatening." },
    obscene: { prevent: "Your message can come across as obscene." },
    identity_hate: {
        prevent: "Your message can promote hate towards a specific identity.",
    },
    toxic: { prevent: "Your message can come acorss as toxic." },
    insult: { prevent: "Your message can come across as insulting." },
}

export function getAboveThreshold(pred: Predictions, threshold: number) {
    return Object.entries(PREDICTION_PRIORITIES)
        .map(([type, message]) => [type, pred[type], message])
        .filter(([k, v]) => v >= threshold)
        .map(([k, , message]) => [k, message])[0]
}

export const useChatStore = createStore({
    chat: "",
    predictions: null as null | Predictions,
})

export function withChatToxiticy(Component): ComponentType {
    return (props) => {
        const [store, setStore] = useChatStore()
        const currentChat = useRef()
        useEffect(() => {
            const chat = store.chat
            currentChat.current = chat
            predictToxicity(chat)
                .then((predictions) => {
                    if (currentChat.current === chat) {
                        setStore({ predictions })
                    }
                    // if the chat changed, ignore the output
                })
                .catch((e) => {
                    console.error(e)
                })
        }, [store.chat])
        const toxicityScore = getAboveThreshold(store.predictions ?? {}, 0.6)
        return (
            <Component
                {...props}
                style={{
                    height: toxicityScore ? undefined : 0,
                    opacity: toxicityScore ? 1 : 0,
                }}
                value={`Not Cool!\n${toxicityScore?.[1].prevent} Are you sure you'd like to send it?`}
            />
        )
    }
}

export function withChatInput(Component): ComponentType {
    return (props) => {
        const [store, setStore] = useChatStore()
        const handleChange = (chat) => {
            setStore({ chat })
        }

        return (
            <Component value={store.chat} onChange={handleChange} {...props} />
        )
    }
}

export function withNewChat(Component): ComponentType {
    return (props) => {
        const [store, setStore] = useChatStore()
        const handleTap = async () => {
            const prediction = predictToxicity(store.chat)
            const doc = await addDoc(collection(firestore, "chats"), {
                message: store.chat,
                user_id: auth.currentUser?.uid,
                created_at: new Date(),
            })
            setStore({ chat: "" })
            await setDoc(doc, { prediction: await prediction }, { merge: true })
        }

        return <Component onTap={handleTap} {...props} />
    }
}
