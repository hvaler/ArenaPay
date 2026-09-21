import type { ArenaState } from '../../../../packages/shared/src/contracts';

export function Arena({ state }: { state: ArenaState }) {
  return <svg className="arena-grid" viewBox="0 0 480 480" role="img" aria-label={`Arena en el tick ${state.tick}: Atlas ${state.agents.A.score} puntos, Nova ${state.agents.B.score} puntos`}>
    <defs>
      <pattern id="cells" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#f8faff" /><path d="M60 0H0V60" fill="none" stroke="#dce3f1" strokeWidth="1" /></pattern>
      <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="1.4" fill="#c6d0e6" /></pattern>
    </defs>
    <rect width="480" height="480" rx="10" fill="url(#cells)" />
    <rect width="480" height="480" fill="url(#dots)" />
    <path d="M0 60V0H60M420 0H480V60M480 420V480H420M60 480H0V420" fill="none" stroke="#b5c2df" strokeWidth="4" />
    {state.resources.map(r => <g key={`${r.x}:${r.y}`} transform={`translate(${r.x * 60 + 30},${r.y * 60 + 30})`}>
      <path d="M0 -15 15 0 0 15 -15 0Z" fill="#ffe1a0" stroke="#bd8116" strokeWidth="1.5" />
      <text textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700" fill="#72500b">{r.value}</text>
    </g>)}
    {(['A', 'B'] as const).map(player => {
      const agent = state.agents[player];
      const overlap = state.agents.A.x === state.agents.B.x && state.agents.A.y === state.agents.B.y;
      const offset = overlap ? (player === 'A' ? -12 : 12) : 0;
      return <g key={player} transform={`translate(${agent.x * 60 + 30 + offset},${agent.y * 60 + 30})`}>
        <circle r={overlap ? 16 : 22} fill={player === 'A' ? '#203ad0' : '#bd493a'} stroke="white" strokeWidth="3" />
        <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="17" fontWeight="750">{player}</text>
      </g>;
    })}
  </svg>;
}
