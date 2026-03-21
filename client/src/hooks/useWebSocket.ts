import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store';

interface WsMessage {
  channel: string;
  timestamp: number;
  data: any;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelay = useRef(1000);
  const [connected, setConnected] = useState(false);

  const setCommercialFlights = useStore((s) => s.setCommercialFlights);
  const setMilitaryFlights = useStore((s) => s.setMilitaryFlights);
  const setSatellites = useStore((s) => s.setSatellites);
  const setEarthquakes = useStore((s) => s.setEarthquakes);
  const setVessels = useStore((s) => s.setVessels);
  const setEntityCount = useStore((s) => s.setEntityCount);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);

        switch (msg.channel) {
          case 'flights:commercial':
            setCommercialFlights(msg.data);
            setEntityCount('commercialFlights', msg.data.length);
            break;
          case 'flights:military':
            setMilitaryFlights(msg.data);
            setEntityCount('militaryFlights', msg.data.length);
            break;
          case 'satellites:tle':
            setSatellites(msg.data);
            setEntityCount('satellites', msg.data.length);
            break;
          case 'vessels':
          case 'maritime': {
            const vessels = Array.isArray(msg.data) ? msg.data : [];
            if (vessels.length > 0) {
              setVessels(vessels);
              setEntityCount('maritime', vessels.length);
            }
            break;
          }
          case 'earthquakes':
            setEarthquakes(msg.data);
            setEntityCount('earthquakes', msg.data.length);
            break;
          // gpsjamming and outages are broadcast-only; layers read seed data
          // and will be upgraded once store slices are added
        }
      } catch {
        // Connected message or malformed
      }
    },
    [setCommercialFlights, setMilitaryFlights, setSatellites, setEarthquakes, setVessels, setEntityCount]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setConnected(true);
      reconnectDelay.current = 1000;
      // Subscribe to all data channels
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: [
          'flights:commercial',
          'flights:military',
          'satellites:tle',
          'earthquakes',
          'vessels',
          'maritime',
          'gpsjamming',
          'outages',
        ],
      }));
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      // Exponential backoff reconnect
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30_000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [handleMessage]);

  const subscribe = useCallback((channels: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', channels }));
    }
  }, []);

  const unsubscribe = useCallback((channels: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', channels }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, subscribe, unsubscribe };
}
