'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type BuiltHomesCarouselProps = {
  images: string[];
};

export function BuiltHomesCarousel({ images }: BuiltHomesCarouselProps) {
  const slides = images.length ? images : ['/casas-construidas-v1.png'];
  const loopingSlides = slides.length > 1 ? [slides[slides.length - 1], ...slides, slides[0]] : slides;
  const [position, setPosition] = useState(slides.length > 1 ? 1 : 0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  useEffect(() => {
    setPosition(images.length > 1 ? 1 : 0);
    setTransitionEnabled(true);
  }, [images.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = window.setInterval(() => {
      setTransitionEnabled(true);
      setPosition(current => current + 1);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  function finishTransition() {
    if (position === 0) {
      setTransitionEnabled(false);
      setPosition(slides.length);
    } else if (position === slides.length + 1) {
      setTransitionEnabled(false);
      setPosition(1);
    }
  }

  function move(direction: -1 | 1) {
    if (slides.length < 2) return;
    setTransitionEnabled(true);
    setPosition(current => current + direction);
  }

  const activeDot = slides.length > 1 ? (position - 1 + slides.length) % slides.length : 0;

  return <div className="built-homes-carousel" aria-label="Fotos de casas construidas">
    <div className={`built-homes-track${transitionEnabled ? '' : ' no-transition'}`} style={{ transform: `translateX(-${position * 100}%)` }} onTransitionEnd={finishTransition}>
      {loopingSlides.map((src, index) => <img key={`${src}-${index}`} src={src} alt={`Casa construida ${index % slides.length + 1}`} loading="lazy" decoding="async" />)}
    </div>
    {slides.length > 1 ? <>
      <button className="built-homes-arrow previous" type="button" onClick={() => move(-1)} aria-label="Ver foto anterior"><ChevronLeft /></button>
      <button className="built-homes-arrow next" type="button" onClick={() => move(1)} aria-label="Ver foto siguiente"><ChevronRight /></button>
    </> : null}
    {slides.length > 1 ? <div className="built-homes-dots" aria-hidden="true">{slides.map((src, index) => <span key={`${src}-dot`} className={index === activeDot ? 'active' : ''} />)}</div> : null}
  </div>;
}
