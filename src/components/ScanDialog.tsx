import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, IconButton, Snackbar, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Board } from '../sudoku/logic';
import { classifyGrid, GRID_SIZE, type RawImage, type ScanResult } from '../scan/classify';
import { findGridQuad, warpGrid, type Quad } from '../scan/detect';
import { loadDigitModel } from '../scan/model';
import { loadOpenCV, type CV } from '../scan/opencv';
import ScanReview from './ScanReview';

interface ScanDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: (board: Board) => void;
}

const DETECT_WIDTH = 320; // frames are downscaled to this width for detection
const DETECT_INTERVAL_MS = 100; // ~10 fps
const STABLE_FRAMES = 5;
const STABLE_TOLERANCE_PX = 10; // max corner drift between frames, at detection scale
const HINT_DELAY_MS = 5000;
const FALLBACK_MAX_WIDTH = 800; // still photos downscaled before detection

type Phase = 'viewfinder' | 'processing' | 'review';

const quadIsStable = (a: Quad, b: Quad): boolean =>
  a.every((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y) < STABLE_TOLERANCE_PX);

const imageDataFrom = (source: CanvasImageSource, width: number, height: number): RawImage => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
};

const ScanDialog = ({ open, onClose, onAccept }: ScanDialogProps) => {
  const [phase, setPhase] = useState<Phase>('viewfinder');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stableQuadRef = useRef<{ quad: Quad; count: number } | null>(null);

  const runPipeline = useCallback(
    async (cv: CV, image: RawImage, quad: Quad) => {
      setPhase('processing');
      try {
        const grid = warpGrid(cv, image, quad, GRID_SIZE);
        const model = await loadDigitModel();
        setResult(await classifyGrid(model, grid));
        setPhase('review');
      } catch {
        setMessage('Could not read the puzzle — try again.');
        setPhase('viewfinder');
      }
    },
    [],
  );

  // Camera + detection loop, active only while the viewfinder shows
  useEffect(() => {
    if (!open || phase !== 'viewfinder' || cameraFailed) return;

    let cancelled = false;
    let rafId = 0;
    let lastTick = 0;
    let stream: MediaStream | null = null;
    stableQuadRef.current = null;
    const hintTimer = window.setTimeout(() => setShowHint(true), HINT_DELAY_MS);

    const start = async () => {
      let cv: CV;
      try {
        [cv, stream] = await Promise.all([
          loadOpenCV(),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }),
        ]);
      } catch {
        if (!cancelled) setCameraFailed(true);
        return;
      }
      void loadDigitModel(); // warm up in parallel; errors surface in runPipeline
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current!;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) setCameraFailed(true);
        return;
      }

      const tick = (now: number) => {
        if (cancelled) return;
        rafId = requestAnimationFrame(tick);
        if (now - lastTick < DETECT_INTERVAL_MS || video.readyState < 2) return;
        lastTick = now;

        const scale = DETECT_WIDTH / video.videoWidth;
        const detectHeight = Math.round(video.videoHeight * scale);
        const frame = imageDataFrom(video, DETECT_WIDTH, detectHeight);
        const quad = findGridQuad(cv, frame);

        const overlay = overlayRef.current;
        if (overlay) {
          overlay.width = video.videoWidth;
          overlay.height = video.videoHeight;
          const ctx = overlay.getContext('2d')!;
          ctx.clearRect(0, 0, overlay.width, overlay.height);
          if (quad) {
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 4;
            ctx.beginPath();
            quad.forEach((p, i) => {
              const x = p.x / scale;
              const y = p.y / scale;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
          }
        }

        if (!quad) {
          stableQuadRef.current = null;
          return;
        }
        const stable = stableQuadRef.current;
        if (stable && quadIsStable(stable.quad, quad)) {
          stable.count++;
          stable.quad = quad;
          if (stable.count >= STABLE_FRAMES) {
            cancelAnimationFrame(rafId);
            cancelled = true;
            const fullFrame = imageDataFrom(video, video.videoWidth, video.videoHeight);
            const fullQuad = quad.map((p) => ({ x: p.x / scale, y: p.y / scale })) as Quad;
            stream?.getTracks().forEach((t) => t.stop());
            void runPipeline(cv, fullFrame, fullQuad);
          }
        } else {
          stableQuadRef.current = { quad, count: 1 };
        }
      };
      rafId = requestAnimationFrame(tick);
    };
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(hintTimer);
      setShowHint(false);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, phase, cameraFailed, runPipeline]);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setPhase('viewfinder');
      setResult(null);
      setCameraFailed(false);
    }
  }, [open]);

  const handleFile = async (file: File) => {
    try {
      const cv = await loadOpenCV();
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, FALLBACK_MAX_WIDTH / bitmap.width);
      const image = imageDataFrom(
        bitmap,
        Math.round(bitmap.width * scale),
        Math.round(bitmap.height * scale),
      );
      const quad = findGridQuad(cv, image);
      if (!quad) {
        setMessage('No grid found in that photo — try another one.');
        return;
      }
      await runPipeline(cv, image, quad);
    } catch {
      setMessage('Could not read that photo — try another one.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <Box sx={{ position: 'relative', height: '100%', bgcolor: 'background.default' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: 'secondary.main' }}
        >
          <CloseIcon />
        </IconButton>

        {phase === 'review' && result ? (
          <ScanReview result={result} onRetake={() => setPhase('viewfinder')} onAccept={onAccept} />
        ) : cameraFailed ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 3,
            }}
          >
            <Typography align="center">
              Camera unavailable. Pick a photo of the puzzle instead.
            </Typography>
            <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
              Choose photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
          </Box>
        ) : (
          <Box sx={{ position: 'relative', height: '100%' }}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas
              ref={overlayRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {(showHint || phase === 'processing') && (
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: 24,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  color: 'secondary.main',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}
              >
                {phase === 'processing'
                  ? 'Reading puzzle…'
                  : 'Fill the frame with the puzzle. Avoid glare.'}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Snackbar
        open={message !== null}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setMessage(null)} severity="info" variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ScanDialog;
