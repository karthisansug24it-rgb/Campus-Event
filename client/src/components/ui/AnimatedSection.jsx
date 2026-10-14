import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const AnimatedSection = ({
  children,
  className = '',
  delay = 0,
  yOffset = 24,
  duration = 0.6,
  stagger = 0,
  ...props
}) => {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: yOffset,
        },
        {
          opacity: 1,
          y: 0,
          duration: duration,
          delay: delay,
          ease: 'power2.out',
          clearProps: 'transform',
        }
      );
    }, elRef);

    return () => ctx.revert();
  }, [delay, yOffset, duration]);

  return (
    <div ref={elRef} className={className} {...props}>
      {children}
    </div>
  );
};
