import { useEffect, useRef } from 'react';
import { useCesiumViewer } from '../../hooks/useCesiumViewer';

export function Minimap() {
  const viewer = useCesiumViewer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewer) return;

    const ctx = canvas.getContext('2d')!;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 2;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Globe circle
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0d1520';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw simplified continents as grid lines
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = 0.5;
      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = center - (lat / 90) * radius;
        ctx.beginPath();
        ctx.moveTo(center - radius, y);
        ctx.lineTo(center + radius, y);
        ctx.stroke();
      }
      // Longitude lines
      for (let lon = -150; lon <= 150; lon += 30) {
        const x = center + (lon / 180) * radius;
        ctx.beginPath();
        ctx.moveTo(x, center - radius);
        ctx.lineTo(x, center + radius);
        ctx.stroke();
      }

      // Camera position indicator
      try {
        const cam = viewer.camera.positionCartographic;
        const camLat = cam.latitude * (180 / Math.PI);
        const camLon = cam.longitude * (180 / Math.PI);
        const px = center + (camLon / 180) * radius;
        const py = center - (camLat / 90) * radius;

        // Camera FOV cone
        ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.arc(px, py, 12, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.closePath();
        ctx.fill();

        // Camera dot
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } catch {
        // Camera not ready
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [viewer]);

  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        width={90}
        height={90}
        style={styles.canvas}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 116,
    right: 12,
    width: 90,
    height: 90,
    pointerEvents: 'auto',
    zIndex: 100,
  },
  canvas: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    border: '1px solid rgba(0, 229, 255, 0.2)',
  },
};
