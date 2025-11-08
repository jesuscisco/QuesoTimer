'use client';

import TournamentEditor from '../../components/TournamentEditor';

export default function Torneo1vs1Page() {
  return (
    <TournamentEditor title="Torneo 1 vs 1" storageKey="tournament.1vs1.v1" mode="oneVsOne" />
  );
}