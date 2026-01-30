'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to increment article view counter
 * Only increments once per page load
 */
export function useViewCounter(articleId: number | string) {
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (hasIncremented.current || !articleId) return;

    const incrementView = async () => {
      try {
        // Call your API endpoint to increment views
        // Adjust the endpoint based on your backend implementation
        await fetch(`/api/articles/${articleId}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        hasIncremented.current = true;
      } catch (error) {
        console.error('Failed to increment view counter:', error);
      }
    };

    // Delay to ensure it's a real visit (not a bot)
    const timer = setTimeout(incrementView, 3000);

    return () => clearTimeout(timer);
  }, [articleId]);
}
