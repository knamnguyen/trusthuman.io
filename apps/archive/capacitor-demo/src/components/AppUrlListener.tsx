import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';

/**
 * AppUrlListener - Handles deep links from OAuth redirects
 *
 * When Safari redirects to capacitordemo://oauth/callback?code=xyz,
 * iOS opens our app and this listener catches the URL and navigates
 * to the appropriate route in our React app.
 */
export const AppUrlListener: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let listenerHandle: any = null;

    const setupListener = async () => {
      listenerHandle = await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        console.log('[AppUrlListener] Deep link opened:', event.url);

        try {
          // Parse the deep link URL
          // Example: capacitordemo://oauth/callback?code=xyz&state=abc
          const url = new URL(event.url);
          const path = url.pathname + url.search;

          if (path) {
            console.log('[AppUrlListener] Navigating to:', path);
            navigate(path);
          }
        } catch (error) {
          console.error('[AppUrlListener] Failed to parse URL:', error);
        }
      });
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate]);

  // This component renders nothing - it just listens for URL events
  return null;
};
