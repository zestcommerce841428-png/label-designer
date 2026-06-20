export default function DataPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Data Sources</h1>
      <p className="text-zinc-500 text-sm mb-8">Connect data sources to auto-fill labels at print time.</p>
      <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center text-zinc-400 text-sm">
        Open the editor and use the <strong>Data</strong> button to import CSV or Excel files per label.
        <br /><br />
        Full database connections (MySQL, PostgreSQL, Google Sheets) coming in Phase 2.
      </div>
    </div>
  )
}
