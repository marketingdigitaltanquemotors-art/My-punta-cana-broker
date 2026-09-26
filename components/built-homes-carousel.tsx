'use client';

import { useEffect, useState } from 'react';

type BuiltHomesCarouselProps = {
  images: string[];
};

export function BuiltHomesCarousel({ images }: BuiltHomesCarouselProps) {
  const slides = images.length ? images : ['/casas-construidas-v1.png'];
  const loopingSlides = slides.length > 1 ? [...slides, slides[0]] : slides;
  const [position, setPosition] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  useEffect(() => {
    setPosition(0);
    setTransitionEnabled(true);
  }, [images]);

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = window.setInterval(() => {
      setTransitionEnabled(true);
      setPosition(current => current + 1);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  function finishTransition() {
    if (position !== slides.length) return;
    setTransitionEnabled(false);
    setPosition(0);
  }

  const activeDot = position === slides.length ? 0 : position;

  return <div className="built-homes-carousel" aria-label="Fotos de casas construidas">
    <div className={`built-homes-track${transitionEnabled ? '' : ' no-transition'}`} style={{ transform: `translateX(-${position * 100}%)` }} onTransitionEnd={finishTransition}>
      {loopingSlides.map((src, index) => <img key={`${src}-${index}`} src={src} alt={`Casa construida ${index % slides.length + 1}`} loading="lazy" decoding="async" />)}
    </div>
    {slides.length > 1 ? <div className="built-homes-dots" aria-hidden="true">{slides.map((src, index) => <span key={`${src}-dot`} className={index === activeDot ? 'active' : ''} />)}</div> : null}
  </div>;
}
