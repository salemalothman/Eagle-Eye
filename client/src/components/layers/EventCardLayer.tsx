import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';
import type { EventCard } from '../../types/entities';

interface Props {
  viewer: Cesium.Viewer;
}

// Seed event cards for Operation Epic Fury demo
const SEED_EVENTS: EventCard[] = [
  {
    id: 'evt_1',
    type: 'VERIFIED',
    title: 'IRANIAN MISSILE LAUNCH DETECTED',
    description: 'Satellite imagery confirms ballistic missile launch from western Iran targeting eastern Mediterranean.',
    timestamp: '2024-10-01T02:15:00Z',
    lat: 33.5,
    lon: 48.0,
    category: 'strike',
  },
  {
    id: 'evt_2',
    type: 'REPORTED',
    title: 'IRAQ AIRSPACE CLOSED',
    description: 'Iraqi civil aviation authority issues emergency NOTAM closing all airspace.',
    timestamp: '2024-10-01T02:20:00Z',
    lat: 33.3,
    lon: 44.4,
    category: 'airspace',
  },
  {
    id: 'evt_3',
    type: 'INFRASTRUCTURE',
    title: 'TEHRAN INTERNET BLACKOUT',
    description: 'Major internet disruption detected across Iranian provinces. BGP routes withdrawing.',
    timestamp: '2024-10-01T02:30:00Z',
    lat: 35.7,
    lon: 51.4,
    category: 'internet',
  },
  {
    id: 'evt_4',
    type: 'VERIFIED',
    title: 'IRON DOME ACTIVATIONS',
    description: 'Multiple Iron Dome interceptions reported across central and northern Israel.',
    timestamp: '2024-10-01T02:45:00Z',
    lat: 32.0,
    lon: 34.8,
    category: 'strike',
  },
  {
    id: 'evt_5',
    type: 'REPORTED',
    title: 'USS EISENHOWER REPOSITIONED',
    description: 'Carrier strike group moving to eastern Mediterranean. F/A-18 sorties detected.',
    timestamp: '2024-10-01T03:00:00Z',
    lat: 34.0,
    lon: 33.0,
    category: 'maritime',
  },
  {
    id: 'evt_6',
    type: 'RETALIATION',
    title: 'IDF RETALIATORY STRIKES',
    description: 'Israeli Air Force conducting strikes on military targets in Syria and Lebanon.',
    timestamp: '2024-10-01T04:30:00Z',
    lat: 33.8,
    lon: 35.5,
    category: 'retaliation',
  },
  {
    id: 'evt_7',
    type: 'VERIFIED',
    title: 'GPS JAMMING DETECTED',
    description: 'Widespread GPS interference across eastern Mediterranean. Aviation safety alerts issued.',
    timestamp: '2024-10-01T02:25:00Z',
    lat: 36.0,
    lon: 37.0,
    category: 'strike',
  },
  {
    id: 'evt_8',
    type: 'INFRASTRUCTURE',
    title: 'SUBMARINE CABLE ANOMALY',
    description: 'Latency spikes detected on EIG submarine cable route through Red Sea.',
    timestamp: '2024-10-01T03:15:00Z',
    lat: 15.0,
    lon: 42.0,
    category: 'internet',
  },
];

const TYPE_COLORS: Record<string, string> = {
  VERIFIED: '#00e5ff',
  REPORTED: '#ffb300',
  INFRASTRUCTURE: '#ce93d8',
  RETALIATION: '#ff3d3d',
};

export function EventCardLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);

  const visible = useStore((s) => s.layers.events.visible);
  const setEntityCount = useStore((s) => s.setEntityCount);

  useEffect(() => {
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (!visible) return;

    setEntityCount('events', SEED_EVENTS.length);

    for (const event of SEED_EVENTS) {
      const color = TYPE_COLORS[event.type] || '#00e5ff';
      const altitude = 80_000;

      // Render floating card as canvas billboard
      const cardImage = renderEventCard(event, color);

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(event.lon, event.lat, altitude),
        billboard: {
          image: cardImage,
          scale: 1.0,
          translucencyByDistance: new Cesium.NearFarScalar(5e4, 1.0, 8e6, 0.3),
          scaleByDistance: new Cesium.NearFarScalar(5e4, 0.8, 8e6, 0.15),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
        },
      });

      // Also add a ground-tether line from surface to card
      const groundEntity = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            event.lon, event.lat, 0,
            event.lon, event.lat, altitude,
          ]),
          width: 1,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString(color).withAlpha(0.3),
            dashLength: 8,
          }),
        },
      });

      entitiesRef.current.push(entity, groundEntity);
    }
  }, [viewer, visible, setEntityCount]);

  return null;
}

// ---- Offscreen canvas card renderer ----

const cardCache = new Map<string, string>();

function renderEventCard(event: EventCard, color: string): string {
  if (cardCache.has(event.id)) return cardCache.get(event.id)!;

  const CARD_W = 280;
  const CARD_H = 120;
  const HEADER_H = 22;
  const PADDING = 10;
  const RADIUS = 4;

  const canvas = document.createElement('canvas');
  const dpr = 2; // Retina sharpness
  canvas.width = CARD_W * dpr;
  canvas.height = CARD_H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Card background with rounded corners
  ctx.beginPath();
  roundRect(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fillStyle = 'rgba(10, 14, 23, 0.92)';
  ctx.fill();
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Colored header bar
  ctx.save();
  ctx.beginPath();
  roundRectTop(ctx, 0, 0, CARD_W, HEADER_H, RADIUS);
  ctx.fillStyle = color + '30';
  ctx.fill();
  // Header bottom line
  ctx.beginPath();
  ctx.moveTo(0, HEADER_H);
  ctx.lineTo(CARD_W, HEADER_H);
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Type badge in header
  ctx.font = 'bold 9px JetBrains Mono, monospace';
  ctx.fillStyle = color;
  ctx.fillText(event.type, PADDING, HEADER_H - 6);

  // Timestamp on right side of header
  const ts = event.timestamp.replace('T', ' ').slice(0, 19) + ' UTC';
  ctx.font = '8px JetBrains Mono, monospace';
  ctx.fillStyle = '#6b7a8d';
  ctx.textAlign = 'right';
  ctx.fillText(ts, CARD_W - PADDING, HEADER_H - 6);
  ctx.textAlign = 'left';

  // Title
  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.fillStyle = '#e0e6ed';
  const titleY = HEADER_H + PADDING + 8;
  wrapText(ctx, event.title, PADDING, titleY, CARD_W - PADDING * 2, 13);

  // Description (truncated)
  ctx.font = '8px JetBrains Mono, monospace';
  ctx.fillStyle = '#6b7a8d';
  const descY = titleY + 18;
  const truncDesc = event.description.length > 80
    ? event.description.slice(0, 77) + '...'
    : event.description;
  wrapText(ctx, truncDesc, PADDING, descY, CARD_W - PADDING * 2, 11);

  // Left accent bar
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 3, CARD_H);

  // Subtle glow at top
  const glow = ctx.createLinearGradient(0, 0, 0, 10);
  glow.addColorStop(0, color + '20');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, 10);

  const url = canvas.toDataURL();
  cardCache.set(event.id, url);
  return url;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}
