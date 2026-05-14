// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { useStore } from '../services/store';
import { WsMessage } from '../types';

const WS_URL = `${import.meta.env.VITE_WS_URL}/ws/admin`;
const RECONNECT_DELAY = 3000;

export function useAdminWebSocket() {
  const { token, setWsConnected, handleWsMessage } = useStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!token) return;

    function connect() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('Admin WS connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          handleWsMessage(msg);
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [token]);
}
