'use client';

import TournamentEditor from '../../components/TournamentEditor';
import { useAppStore } from '../../store/useAppStoreSimple';

export default function TorneoMultiPage() {
  const timerTitle = useAppStore((s) => s.timerTitle) || 'Boards and Hobbies';
  return (
    <TournamentEditor title={timerTitle} storageKey="tournament.multi.v1" mode="ffa" />
  );
}
