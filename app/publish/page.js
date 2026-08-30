import { Suspense } from 'react'
import PublishClient from './PublishClient'

export default function PublishPage() {
  return <Suspense fallback={<main className="publish-shell"><section className="publish-wrap"><div className="card"><p>Loading publish kit…</p></div></section></main>}><PublishClient /></Suspense>
}
