import { createRoot } from 'react-dom/client'
import './options.css'

const test = <p>Hello from options!</p>

const container = document.createElement('div')
document.body.appendChild(container)

const root = createRoot(container)
root.render(test)
