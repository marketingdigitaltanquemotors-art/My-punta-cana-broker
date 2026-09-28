'use client';

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FALLBACK_IMAGE = '/casas-construidas-v1.png';

type BuiltHomesCarouselProps = {
  images: string[];
};

export function BuiltHomesCarousel({ images }: BuiltHomesCarouselProps) {
  const slides = images.length ? images : [FALLBACK_IMAGE];
  const loopingSlides = slides.length > 1 ? [slides[slides.length - 1], ...slides, slides[0]] : slides;
  const initialPosition = slides.length > 1 ? 1 : 0;
  const [position, setPosition] = useState(initialPosition);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const positionRef = useRef(initialPosition);
  const animatingRef = useRef(false);
  const imageSignature = slides.join('|');

  useEffect(() => {
    const nextPosition = images.length > 1 ? 1 : 0;
    positionRef.current = nextPosition;
    animatingRef.current = false;
    setPosition(nextPosition);
    setTransitionEnabled(true);
  }, [images.length]);

  const move = useCallback((direction: -1 | 1) => {
    if (slides.length < 2 || animatingRef.current) return;
    const nextPosition = Math.min(slides.length + 1, Math.max(0, positionRef.current + direction));
    if (nextPosition === positionRef.current) return;
    animatingRef.current = true;
    positionRef.current = nextPosition;
    setTransitionEnabled(true);
    setPosition(nextPosition);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = window.setInterval(() => move(1), 4500);
    return () => window.clearInterval(interval);
  }, [move, slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const currentIndex = (position - 1 + slides.length) % slides.length;
    const neighboringSources = [slides[(currentIndex + 1) % slides.length], slides[(currentIndex - 1 + slides.length) % slides.length]];
    const preloaders = neighboringSources.map(src => {
      const image = new Image();
      image.src = src;
      return image;
    });
    return () => preloaders.forEach(image => { image.src = ''; });
  }, [imageSignature, position, slides.length]);

  function finishTransition() {
    let correctedPosition = position;
    if (position === 0) correctedPosition = slides.length;
    else if (position === slides.length + 1) correctedPosition = 1;

    if (correctedPosition !== position) {
      positionRef.current = correctedPosition;
      setTransitionEnabled(false);
      setPosition(correctedPosition);
      window.setTimeout(() => { animatingRef.current = false; }, 50);
    } else {
      animatingRef.current = false;
    }
  }

  function recoverImage(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied === 'true') return;
    image.dataset.fallbackApplied = 'true';
    image.src = FALLBACK_IMAGE;
  }

  const activeDot = slides.length > 1 ? (position - 1 + slides.length) % slides.length : 0;

  return <div className="built-homes-carousel" aria-label="Fotos de casas construidas">
    <div className={`built-homes-track${transitionEnabled ? '' : ' no-transition'}`} style={{ transform: `translateX(-${position * 100}%)` }} onTransitionEnd={finishTransition}>
      {loopingSlides.map((src, index) => <img key={`${src}-${index}`} src={src} alt={`Casa construida ${index % slides.length + 1}`} loading={index <= 2 ? 'eager' : 'lazy'} decoding="async" onError={recoverImage} />)}
    </div>
    {slides.length > 1 ? <>
      <button className="built-homes-arrow previous" type="button" onClick={() => move(-1)} aria-label="Ver foto anterior"><ChevronLeft /></button>
      <button className="built-homes-arrow next" type="button" onClick={() => move(1)} aria-label="Ver foto siguiente"><ChevronRight /></button>
    </> : null}
    {slides.length > 1 ? <div className="built-homes-dots" aria-hidden="true">{slides.map((src, index) => <span key={`${src}-dot`} className={index === activeDot ? 'active' : ''} />)}</div> : null}
  </div>;
}
