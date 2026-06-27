export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-zinc-900 lg:flex">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <h1 className="text-lg font-bold text-white">Poker Club</h1>
        </div>
        <nav className="flex-1 p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Menu</p>
          <p className="text-sm text-zinc-400">Sidebar em construção</p>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
