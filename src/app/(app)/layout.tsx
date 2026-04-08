import { Sidebar } from '@/components/sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-honey-100">
      <Sidebar />
      <main className="lg:ml-64 pb-24 lg:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}
