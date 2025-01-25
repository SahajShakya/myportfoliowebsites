import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    let frameId: number;

    const animateProgress = () => {
      setProgress((prev) => {
        if (prev >= 100) {
          cancelAnimationFrame(frameId);
          return 100;
        }
        return prev + 1;
      });
      frameId = requestAnimationFrame(animateProgress);
    };

    frameId = requestAnimationFrame(animateProgress); // Start the animation

    return () => cancelAnimationFrame(frameId); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      {/* Rotating Circle */}
      <div className="relative mb-4">
        <div className="w-40 h-40 border-8 border-t-8 border-blue-500 rounded-full animate-smooth-spin"></div>
      </div>

      {/* Loading Bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
