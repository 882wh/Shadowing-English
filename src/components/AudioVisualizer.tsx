import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
}

export default function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function initAudio() {
      if (!isRecording) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;
      } catch (err) {
        console.warn('Microphone access denied or error. Falling back to animated simulated waveform:', err);
      }
    }

    if (isRecording) {
      initAudio();
    }

    return () => {
      active = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isRecording]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let simTime = 0;

    const render = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;

      // Clear with soft beige layout matching our Duolingo style backdrops
      ctx.fillStyle = '#FAF8F5';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#58CC02'; // Duolingo primary bright green wave!

      if (isRecording) {
        simTime += 0.15;
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        if (analyser && dataArray) {
          // Real Mic Analyser
          analyser.getByteFrequencyData(dataArray);
          const barWidth = (width / dataArray.length) * 1.5;
          let x = 0;

          ctx.beginPath();
          for (let i = 0; i < dataArray.length; i++) {
            const percent = dataArray[i] / 255;
            const amp = percent * (height * 0.7);
            const yOffset = Math.sin(simTime + i * 0.2) * 5; // Add organic wobble
            const finalAmp = Math.max(2, amp + yOffset);

            const y1 = height / 2 - finalAmp / 2;
            const y2 = height / 2 + finalAmp / 2;

            if (i === 0) {
              ctx.moveTo(x, height / 2);
            }
            ctx.lineTo(x, y1);
            ctx.lineTo(x, y2);

            x += barWidth + 2;
          }
          ctx.stroke();
        } else {
          // Mock Simulation Waveform
          ctx.beginPath();
          const points = 24;
          const barWidth = width / points;

          for (let i = 0; i < points; i++) {
            const sineInput = simTime + (i * 0.4);
            const waveScale = Math.sin(sineInput) * Math.cos(sineInput * 0.5);
            const multiplier = 0.2 + 0.6 * Math.abs(waveScale);
            // Height amplitude spikes in the center
            const centerFactor = 1 - Math.abs(i - points / 2) / (points / 2);
            const amp = Math.max(4, height * 0.7 * multiplier * centerFactor);

            const x = i * barWidth + barWidth / 2;
            const y1 = height / 2 - amp / 2;
            const y2 = height / 2 + amp / 2;

            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
          }
          ctx.stroke();
        }
      } else {
        // Idle flat state
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#E3DCD1';
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  return (
    <div className="w-full flex justify-center items-center py-4">
      <div className="relative w-full max-w-md h-24 rounded-2xl overflow-hidden border-2 border-[#E3DCD1] bg-[#FAF8F5]">
        <canvas
          id="visualizer-canvas"
          ref={canvasRef}
          width={400}
          height={96}
          className="w-full h-full block"
        />
        {isRecording && (
          <div className="absolute top-2 right-3 flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
              LIVE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
