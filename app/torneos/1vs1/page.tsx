'use client';

import TournamentEditor from '../../components/TournamentEditor';
import { useAppStore } from '../../store/useAppStoreSimple';

export default function Torneo1vs1Page() {
  const timerTitle = useAppStore((s) => s.timerTitle) || 'Boards and Hobbies';
  return (
    <TournamentEditor title={timerTitle} storageKey="tournament.1vs1.v1" mode="oneVsOne" />
  );
}