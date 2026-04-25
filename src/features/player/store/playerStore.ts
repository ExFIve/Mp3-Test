import { create } from "zustand";
import type { RepeatMode, Track } from "../../../shared/types/music";

interface PlayerState {
  queue: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  /** When shuffle is on, a permutation of queue track ids for next/prev navigation. */
  shuffledOrder: string[];
  setQueue: (tracks: Track[]) => void;
  setCurrentTrack: (trackId?: string) => void;
  setPlaying: (playing: boolean) => void;
  setProgress: (currentTimeSec: number, durationSec: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeatMode: () => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

function getIndex(queue: Track[], id?: string): number {
  if (!id) return -1;
  return queue.findIndex((track) => track.id === id);
}

function shuffleTrackIds(queue: Track[]): string[] {
  const ids = queue.map((t) => t.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentTrackId: undefined,
  isPlaying: false,
  currentTimeSec: 0,
  durationSec: 0,
  volume: 0.8,
  repeatMode: "off",
  shuffle: false,
  shuffledOrder: [],
  setQueue(queue) {
    set((state) => {
      const keepCurrent =
        state.currentTrackId !== undefined && queue.some((t) => t.id === state.currentTrackId);
      const nextCurrent = keepCurrent ? state.currentTrackId : queue[0]?.id;
      const shuffledOrder = state.shuffle && queue.length > 0 ? shuffleTrackIds(queue) : [];
      return {
        queue,
        currentTrackId: nextCurrent,
        shuffledOrder,
      };
    });
  },
  setCurrentTrack(trackId) {
    set({ currentTrackId: trackId, currentTimeSec: 0 });
  },
  setPlaying(playing) {
    set({ isPlaying: playing });
  },
  setProgress(currentTimeSec, durationSec) {
    set({ currentTimeSec, durationSec });
  },
  setVolume(volume) {
    set({ volume: Math.min(1, Math.max(0, volume)) });
  },
  toggleRepeatMode() {
    const sequence: RepeatMode[] = ["off", "all", "one"];
    set((state) => {
      const index = sequence.indexOf(state.repeatMode);
      return { repeatMode: sequence[(index + 1) % sequence.length] };
    });
  },
  toggleShuffle() {
    set((state) => {
      const nextShuffle = !state.shuffle;
      const shuffledOrder = nextShuffle && state.queue.length > 0 ? shuffleTrackIds(state.queue) : [];
      return { shuffle: nextShuffle, shuffledOrder };
    });
  },
  playNext() {
    const { queue, currentTrackId, repeatMode, shuffle, shuffledOrder } = get();
    if (queue.length === 0) return;
    if (repeatMode === "one") return;

    if (shuffle && shuffledOrder.length === queue.length) {
      const i = currentTrackId ? shuffledOrder.indexOf(currentTrackId) : -1;
      const atEnd = i === shuffledOrder.length - 1;
      if (atEnd) {
        if (repeatMode === "all") {
          set({ currentTrackId: shuffledOrder[0], currentTimeSec: 0, isPlaying: true });
        } else {
          set({ isPlaying: false, currentTimeSec: 0 });
        }
        return;
      }
      const nextIdx = i < 0 ? 0 : i + 1;
      set({ currentTrackId: shuffledOrder[nextIdx], currentTimeSec: 0, isPlaying: true });
      return;
    }

    const currentIndex = getIndex(queue, currentTrackId);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        set({ currentTrackId: queue[0].id, currentTimeSec: 0, isPlaying: true });
      } else {
        set({ isPlaying: false, currentTimeSec: 0 });
      }
      return;
    }
    set({ currentTrackId: queue[nextIndex].id, currentTimeSec: 0, isPlaying: true });
  },
  playPrevious() {
    const { queue, currentTrackId, shuffle, shuffledOrder } = get();
    if (queue.length === 0) return;

    if (shuffle && shuffledOrder.length === queue.length) {
      const i = currentTrackId ? shuffledOrder.indexOf(currentTrackId) : -1;
      if (i <= 0) {
        set({ currentTrackId: shuffledOrder[0], currentTimeSec: 0, isPlaying: true });
        return;
      }
      set({ currentTrackId: shuffledOrder[i - 1], currentTimeSec: 0, isPlaying: true });
      return;
    }

    const currentIndex = getIndex(queue, currentTrackId);
    if (currentIndex <= 0) {
      set({ currentTrackId: queue[0]?.id, currentTimeSec: 0, isPlaying: true });
      return;
    }
    set({ currentTrackId: queue[currentIndex - 1].id, currentTimeSec: 0, isPlaying: true });
  },
}));
