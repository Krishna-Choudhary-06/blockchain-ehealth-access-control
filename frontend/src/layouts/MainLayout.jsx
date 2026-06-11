import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
