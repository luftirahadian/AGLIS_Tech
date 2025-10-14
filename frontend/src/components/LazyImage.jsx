// ═══════════════════════════════════════════════════════════════
// 🖼️ LAZY LOADING IMAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
// Optimized image loading with lazy loading and placeholder
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/placeholder.svg',
  onLoad,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let observer;
    
    if (imageRef && imageSrc === placeholder) {
      // Use Intersection Observer for lazy loading
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before image is visible
        }
      );

      observer.observe(imageRef);
    }

    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, src, placeholder]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setImageSrc(placeholder);
  };

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage;

