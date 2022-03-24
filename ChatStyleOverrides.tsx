import type { ComponentType } from "react"

export function withTransform(Component): ComponentType {
    return (props) => {
        return (
            <Component {...props} style={{ marginLeft: -7, marginRight: -7 }} />
        )
    }
}
