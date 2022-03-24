import { useRef, useEffect, ComponentType } from "react"
import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"

export const useChatScrollStore = createStore({})

export function withChatScroll(Component): ComponentType {
    return (props) => {
        const ref = useRef<any>()

        useChatScrollStore()
        useEffect(() => {
            if (!ref.current) return
            ref.current.scrollTop = ref.current.scrollHeight
        })

        return <Component ref={ref} {...props} />
    }
}
