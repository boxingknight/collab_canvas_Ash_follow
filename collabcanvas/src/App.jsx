import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>🎨 CollabCanvas</h1>
        <h2>Real-Time Collaborative Canvas MVP</h2>
      </div>
      <div className="card">
        <p>
          <strong>Status:</strong> Deployment pipeline is working! ✅
        </p>
        <button onClick={() => setCount((count) => count + 1)}>
          Test Counter: {count}
        </button>
        <p style={{ marginTop: '20px' }}>
          Firebase configured and ready for authentication.
        </p>
      </div>
      <p className="read-the-docs">
        Project setup complete. Ready for PR#2: Authentication System.
      </p>
    </>
  )
}

export default App
