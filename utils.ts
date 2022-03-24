import { useState, useEffect, useRef } from "react"

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])
    return debouncedValue
}

export function predictToxicity(chat: string) {
    const postOptions = {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: [chat],
        }),
    } as const
    return fetch(
        "https://max-toxic-comment-classifier-io7rguwotq-uc.a.run.app/model/predict",
        postOptions
    )
        .then((response) => response.json())
        .then((data) => {
            return data.results[0].predictions
        })
}
