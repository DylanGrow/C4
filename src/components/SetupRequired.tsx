interface SetupRequiredProps {
  onBack: () => void
}

export function SetupRequired({ onBack }: SetupRequiredProps) {
  const sql = `create table games (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  board jsonb not null,
  current_turn int2 not null default 1,
  status text not null default 'waiting',
  winner int2 not null default 0,
  player1_id text not null,
  player2_id text,
  created_at timestamptz default now()
);
alter table games enable row level security;
create policy "public read" on games for select using (true);
create policy "public insert" on games for insert with check (true);
create policy "public update" on games for update using (true);`

  return (
    <div className="flex flex-col gap-6 py-8 px-4 w-full max-w-lg mx-auto">
      <div className="text-center">
        <div className="text-4xl mb-3">🔧</div>
        <h2 className="text-xl font-bold text-white">Supabase Setup Required</h2>
        <p className="text-slate-400 text-sm mt-1">Remote play needs a free Supabase project.</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 text-sm text-slate-300 space-y-3">
        <p className="font-semibold text-white">3 steps to enable remote play:</p>
        <ol className="space-y-2 list-none">
          {[
            <>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"
              className="text-blue-400 underline">supabase.com</a></>,
            <>Run this SQL in the SQL editor:</>,
            <>Add to your <code className="text-amber-400">.env.local</code>:<br/>
              <code className="text-green-400 block mt-1">VITE_SUPABASE_URL=https://xxx.supabase.co<br/>
              VITE_SUPABASE_ANON_KEY=your_anon_key</code></>
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-blue-400 font-mono font-bold w-5 shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <pre className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto mt-2 font-mono">
          {sql}
        </pre>
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white
          hover:border-slate-400 font-medium transition-colors focus:outline-none focus:ring-2
          focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        ← Back
      </button>
    </div>
  )
}
