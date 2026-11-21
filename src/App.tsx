import { Header } from './components/Header'
import { Link } from './components/Link'
import { matchRoute, usePath } from './lib/router'
import { StoreProvider } from './lib/store'
import { Accept } from './pages/Accept'
import { Console } from './pages/Console'
import { Impact } from './pages/Impact'
import { NewRescue } from './pages/NewRescue'
import { RescueDetail } from './pages/RescueDetail'

function Shell() {
  const path = usePath()
  const route = matchRoute(path)

  if (route.name === 'accept' && route.id) {
    return <Accept id={route.id} />
  }

  return (
    <div className="min-h-full">
      <Header />
      {route.name === 'console' && <Console />}
      {route.name === 'new' && <NewRescue />}
      {route.name === 'impact' && <Impact />}
      {route.name === 'rescue' && route.id && <RescueDetail id={route.id} />}
      {route.name === 'notfound' && (
        <main className="mx-auto max-w-[520px] px-5 py-20">
          <h1 className="text-[30px]">Nothing on this shelf</h1>
          <p className="mt-2 text-[13.5px]" style={{ color: 'var(--color-ink-2)' }}>
            That address is not part of the desk.
          </p>
          <Link to="/" className="btn mt-4">
            Back to the rescue desk
          </Link>
        </main>
      )}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
