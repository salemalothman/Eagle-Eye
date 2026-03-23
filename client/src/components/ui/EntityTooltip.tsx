import { useStore } from '../../store';

export function EntityTooltip() {
  const hoveredEntity = useStore((s) => s.hoveredEntity);
  const hoveredEntityType = useStore((s) => s.hoveredEntityType);
  const tooltipPosition = useStore((s) => s.tooltipPosition);

  if (!hoveredEntity || !hoveredEntityType) return null;

  const rows = getTooltipRows(hoveredEntity, hoveredEntityType);
  if (rows.length === 0) return null;

  return (
    <div
      style={{
        ...styles.container,
        left: tooltipPosition.x + 14,
        top: tooltipPosition.y + 14,
      }}
    >
      {rows.map(({ label, value }, i) => (
        <div key={i} style={styles.row}>
          <span style={styles.label}>{label}</span>
          <span style={styles.value}>{value}</span>
        </div>
      ))}
    </div>
  );
}

interface TooltipRow {
  label: string;
  value: string;
}

function getTooltipRows(entity: any, type: string): TooltipRow[] {
  switch (type) {
    case 'flight':
    case 'commercialFlight':
    case 'militaryFlight':
      return [
        { label: 'CALLSIGN', value: entity.callsign || entity.name || 'N/A' },
        { label: 'ALT', value: entity.altitude != null ? `${Math.round(entity.altitude)} ft` : 'N/A' },
        { label: 'SPD', value: entity.speed != null ? `${Math.round(entity.speed)} kts` : 'N/A' },
        { label: 'HDG', value: entity.heading != null ? `${Math.round(entity.heading)}\u00b0` : 'N/A' },
      ];
    case 'satellite':
      return [
        { label: 'NAME', value: entity.name || 'N/A' },
        { label: 'NORAD ID', value: entity.noradId != null ? String(entity.noradId) : 'N/A' },
        { label: 'ALT', value: entity.altitude != null ? `${Math.round(entity.altitude)} km` : 'N/A' },
      ];
    case 'vessel':
    case 'maritime':
      return [
        { label: 'NAME', value: entity.name || 'N/A' },
        { label: 'MMSI', value: entity.mmsi != null ? String(entity.mmsi) : 'N/A' },
        { label: 'SPD', value: entity.speed != null ? `${entity.speed} kts` : 'N/A' },
      ];
    case 'earthquake':
      return [
        { label: 'MAG', value: entity.magnitude != null ? String(entity.magnitude) : 'N/A' },
        { label: 'LOCATION', value: entity.place || entity.location || 'N/A' },
        { label: 'DEPTH', value: entity.depth != null ? `${entity.depth} km` : 'N/A' },
      ];
    default:
      return [];
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    zIndex: 200,
    background: 'rgba(10, 14, 23, 0.95)',
    border: '1px solid #00e5ff',
    borderRadius: 4,
    padding: '8px 10px',
    pointerEvents: 'none',
    fontFamily: "'JetBrains Mono', monospace",
    minWidth: 140,
    maxWidth: 260,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '1px 0',
  },
  label: {
    fontSize: 8,
    fontWeight: 600,
    color: '#6b7a8d',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  },
  value: {
    fontSize: 9,
    fontWeight: 500,
    color: '#e0e6ed',
    textAlign: 'right' as const,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
