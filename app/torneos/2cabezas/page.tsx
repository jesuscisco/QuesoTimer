'use client';

import TournamentEditor from '../../components/TournamentEditor';
import { useAppStore } from '../../store/useAppStoreSimple';

export default function TorneoDosCabezasPage() {
  const timerTitle = useAppStore((s) => s.timerTitle) || 'Boards and Hobbies';
  return (
    <TournamentEditor title={timerTitle} storageKey="tournament.2cabezas.v1" mode="twoHeads" />
  );
}
