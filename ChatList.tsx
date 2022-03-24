import { motion } from "framer-motion"
import { useEffect, useState, ComponentType } from "react"
import {
    query,
    orderBy,
    collection,
} from "https://jspm.dev/@firebase/firestore"
import { firestore, useCollection, auth } from "./firebase.ts"
import Chat from "https://framer.com/m/Chat-6qtv.js"
import { getAboveThreshold } from "./ChatOverrides.tsx"
import { useChatScrollStore } from "./ChatScrollOverrides.tsx"
import { useMyMoodTapHandler } from "./MoodOverrides.tsx"

const WrappedChat = ({ c, isLast }) => {
    const handleUp = useMyMoodTapHandler(c, 1)
    const handleDown = useMyMoodTapHandler(c, -1)
    return (
        <Chat
            style={{ width: "100%" }}
            message={c.message}
            variant={
                c.user_id === auth.currentUser?.uid
                    ? "Own"
                    : isLast &&
                      getAboveThreshold(c.prediction ?? {}, 0.9) != null
                    ? "Expanded"
                    : "Default"
            }
            up={handleUp}
            down={handleDown}
        />
    )
}

export default function ChatList(props) {
    const { style } = props
    const [, setStore] = useChatScrollStore()

    const [chats] = useCollection(
        query(collection(firestore, "chats"), orderBy("created_at"))
    )
    useEffect(() => {
        setStore({})
    }, [chats])

    return (
        <motion.div style={{ ...style, ...containerStyle }}>
            {chats?.map((c, index) => (
                <WrappedChat
                    key={c.id}
                    c={c}
                    isLast={index === chats.length - 1}
                />
            ))}
        </motion.div>
    )
}

const containerStyle = {
    display: "flex",
    flexDirection: "column",
    width: "auto",
    gap: 8,
}
