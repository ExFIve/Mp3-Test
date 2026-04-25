import { useEffect, useMemo, useRef } from "react";
import { useLibraryStore } from "../../library/store/libraryStore";
import { usePlayerStore } from "../store/playerStore";
import { formatDuration } from "../../../shared/utils/time";

export function PlayerBar(): JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const sourceNodeRef = useRef<MediaElementAudioSourceNode>();
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer>>();
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const fileByTrackId = useLibraryStore((state) => state.fileByTrackId);
  const queue = usePlayerStore((state) => state.queue);
  const currentTrackId = usePlayerStore((state) => state.currentTrackId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTimeSec = usePlayerStore((state) => state.currentTimeSec);
  const durationSec = usePlayerStore((state) => state.durationSec);
  const volume = usePlayerStore((state) => state.volume);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const setProgress = usePlayerStore((state) => state.setProgress);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleRepeatMode = usePlayerStore((state) => state.toggleRepeatMode);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);

  const currentTrack = useMemo(() => queue.find((track) => track.id === currentTrackId), [queue, currentTrackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const file = currentTrackId ? fileByTrackId[currentTrackId] : undefined;
    if (!file) return;

    const url = URL.createObjectURL(file);
    audio.src = url;
    if (isPlaying) void audio.play();
    return () => URL.revokeObjectURL(url);
  }, [currentTrackId, fileByTrackId, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) void audio.play();
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTimeSec;
    durationRef.current = durationSec;
  }, [currentTimeSec, durationSec]);

  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    function drawIdle(ctx: CanvasRenderingContext2D): void {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#242424";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawIdle(ctx);

    const ensureAnalyser = (): boolean => {
      if (analyserRef.current && audioContextRef.current && dataArrayRef.current) return true;
      try {
        const context = new AudioContext();
        const source = context.createMediaElementSource(audio);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyser.connect(context.destination);
        audioContextRef.current = context;
        sourceNodeRef.current = source;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        return true;
      } catch {
        return false;
      }
    };

    const draw = (): void => {
      const analyser = analyserRef.current;
      const data = dataArrayRef.current;
      if (!analyser || !data) {
        drawIdle(ctx);
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      analyser.getByteTimeDomainData(data);
      const { width, height } = ctx.canvas;
      ctx.fillStyle = "#242424";
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1db954";
      ctx.beginPath();

      const sliceWidth = width / data.length;
      for (let i = 0; i < data.length; i += 1) {
        const v = data[i] / 128.0;
        const y = (v * height) / 2;
        const x = i * sliceWidth;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const progressRatio =
        durationRef.current > 0 ? Math.min(1, Math.max(0, currentTimeRef.current / durationRef.current)) : 0;
      const markerX = Math.floor(width * progressRatio);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.moveTo(markerX, 0);
      ctx.lineTo(markerX, height);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    const resumeAndStart = async (): Promise<void> => {
      if (!ensureAnalyser()) return;
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
    };

    const stopDrawLoop = (): void => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
      drawIdle(ctx);
    };

    const onStart = (): void => {
      void resumeAndStart();
    };
    const onStop = (): void => {
      stopDrawLoop();
    };

    audio.addEventListener("play", onStart);
    audio.addEventListener("pause", onStop);
    audio.addEventListener("ended", onStop);

    if (isPlaying) void resumeAndStart();

    return () => {
      audio.removeEventListener("play", onStart);
      audio.removeEventListener("pause", onStop);
      audio.removeEventListener("ended", onStop);
      stopDrawLoop();
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      sourceNodeRef.current?.disconnect();
      analyserRef.current?.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    };
  }, []);

  function onSeek(value: number): void {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setProgress(audio.currentTime, audio.duration || 0);
  }

  return (
    <section className="player-bar card">
      <audio
        ref={audioRef}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime, event.currentTarget.duration || 0)}
        onEnded={() => playNext()}
      />
      <div className="player-row">
        <div>
          <strong>{currentTrack?.title ?? "No track selected"}</strong>
          <div>{currentTrack ? `${currentTrack.artist} - ${currentTrack.album}` : "Import a file to begin."}</div>
        </div>
        <div className="player-controls">
          <button onClick={playPrevious}>Prev</button>
          <button onClick={() => setPlaying(!isPlaying)} disabled={!currentTrack}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button onClick={playNext}>Next</button>
          <button onClick={toggleShuffle}>Shuffle: {shuffle ? "On" : "Off"}</button>
          <button onClick={toggleRepeatMode}>Repeat: {repeatMode}</button>
        </div>
      </div>
      <div className="player-row">
        <span>{formatDuration(currentTimeSec)}</span>
        <input
          type="range"
          min={0}
          max={durationSec || 0}
          step={0.1}
          value={Math.min(currentTimeSec, durationSec || 0)}
          onChange={(event) => onSeek(Number(event.target.value))}
          disabled={!currentTrack}
        />
        <span>{formatDuration(durationSec)}</span>
        <label>
          Vol
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </label>
      </div>
      <div className="waveform-wrap">
        <canvas ref={waveformCanvasRef} className="waveform-canvas" width={900} height={64} />
      </div>
    </section>
  );
}
