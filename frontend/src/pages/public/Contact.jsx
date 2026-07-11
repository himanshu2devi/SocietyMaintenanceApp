import { useState } from 'react'
import { Alert } from '../../components/ui/Feedback'

export default function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="text-gray-600">
        Have a question about SocietyWale? Send us a message and we'll get back to you.
      </p>

      {sent && <Alert type="success">Thanks! Your message has been received.</Alert>}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" required placeholder="Your name" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" required placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input" rows="4" required placeholder="How can we help?" />
        </div>
        <button className="btn-primary w-full">Send Message</button>
      </form>
    </div>
  )
}
