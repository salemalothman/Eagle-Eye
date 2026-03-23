export type LayerId =
  | 'commercialFlights'
  | 'militaryFlights'
  | 'satellites'
  | 'maritime'
  | 'earthquakes'
  | 'gpsJamming'
  | 'internetOutages'
  | 'airspaceClosures'
  | 'cctvMesh'
  | 'events'
  | 'streetTraffic'
  | 'weatherRadar'
  | 'bikeshare';

export type ShaderMode = 'normal' | 'crt' | 'nvg' | 'flir' | 'anime' | 'noir' | 'snow' | 'ai' | 'pixar' | 'bloom' | 'nil';

export type AppMode = 'live' | 'playback';

export interface LayerConfig {
  id: LayerId;
  label: string;
  visible: boolean;
  opacity: number;
  entityCount: number;
  color: string;
  icon: string;
  source: string;
  lastUpdate: number | null;
}
