'use client';

import { useEffect, useRef } from 'react';

type ViewportVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  onError?: () => void;
};

export function ViewportVideo({ src, poster, className, onError }: ViewportVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!video.src) video.src = src;
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, { threshold: 0.05 });

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  return <video ref={ref} poster={poster} className={className} preload="none" muted playsInline loop onError={onError} />;
}
