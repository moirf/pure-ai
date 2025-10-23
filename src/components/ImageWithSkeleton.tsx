import React, { useState } from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  skeletonClassName?: string;
  fallbackSrc?: string;
};

const ImageWithSkeleton: React.FC<Props> = ({ src, alt, className, skeletonClassName = 'bg-gray-200', fallbackSrc, ...rest }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      {!loaded && (
        <div className={`${skeletonClassName} animate-pulse absolute inset-0`} />
      )}

      {!errored && (
        <img
          src={typeof src === 'string' ? src : undefined}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setErrored(true);
            setLoaded(true);
          }}
          {...rest}
        />
      )}

      {errored && fallbackSrc && (
        <img src={fallbackSrc} alt={alt} onLoad={() => setLoaded(true)} className="w-full h-full object-cover" />
      )}
    </div>
  );
};

export default ImageWithSkeleton;
