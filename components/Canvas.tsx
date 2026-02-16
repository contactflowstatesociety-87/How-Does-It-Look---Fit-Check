
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon, UndoIcon, RedoIcon, HeartIcon, ShareIcon, DownloadIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  displayImageUrl, 
  onStartOver, 
  isLoading, 
  loadingMessage, 
  onSelectPose, 
  poseInstructions, 
  currentPoseIndex, 
  availablePoseKeys,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave
}) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);
  const [isShareSuccess, setIsShareSuccess] = useState(false);
  
  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return;
    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    if (currentIndexInAvailable === -1) {
        onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length);
        return;
    }
    const prevIndexInAvailable = (currentIndexInAvailable - 1 + availablePoseKeys.length) % availablePoseKeys.length;
    const prevPoseInstruction = availablePoseKeys[prevIndexInAvailable];
    const newGlobalPoseIndex = poseInstructions.indexOf(prevPoseInstruction);
    if (newGlobalPoseIndex !== -1) onSelectPose(newGlobalPoseIndex);
  };

  const handleNextPose = () => {
    if (isLoading) return;
    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    if (currentIndexInAvailable === -1 || availablePoseKeys.length === 0) {
        onSelectPose((currentPoseIndex + 1) % poseInstructions.length);
        return;
    }
    const nextIndexInAvailable = currentIndexInAvailable + 1;
    if (nextIndexInAvailable < availablePoseKeys.length) {
        const nextPoseInstruction = availablePoseKeys[nextIndexInAvailable];
        const newGlobalPoseIndex = poseInstructions.indexOf(nextPoseInstruction);
        if (newGlobalPoseIndex !== -1) onSelectPose(newGlobalPoseIndex);
    } else {
        const newGlobalPoseIndex = (currentPoseIndex + 1) % poseInstructions.length;
        onSelectPose(newGlobalPoseIndex);
    }
  };

  const downloadImage = () => {
    if (!displayImageUrl) return;
    const link = document.createElement('a');
    link.href = displayImageUrl;
    link.download = `fit-check-outfit-${Date.now()}.png`;
    link.click();
  };

  const shareOutfit = () => {
    const text = "Check out my new fit! Styled with AI.";
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'My AI Outfit', text, url });
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      setIsShareSuccess(true);
      setTimeout(() => setIsShareSuccess(false), 2000);
    }
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      {/* Top Left Controls: Start Over & Undo/Redo */}
      <div className="absolute top-4 left-4 z-30 flex gap-2">
        <button 
            onClick={onStartOver}
            className="flex items-center justify-center bg-white/60 border border-gray-300/80 text-gray-700 font-semibold py-2 px-4 rounded-full transition-all hover:bg-white text-sm backdrop-blur-sm"
        >
            <RotateCcwIcon className="w-4 h-4 mr-2" />
            Start Over
        </button>
        
        <div className="flex bg-white/60 border border-gray-300/80 rounded-full backdrop-blur-sm overflow-hidden">
          <button 
              onClick={onUndo}
              disabled={!canUndo || isLoading}
              className="p-2 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Undo Outfit Change"
          >
              <UndoIcon className="w-4 h-4 text-gray-700" />
          </button>
          <div className="w-px bg-gray-300/50" />
          <button 
              onClick={onRedo}
              disabled={!canRedo || isLoading}
              className="p-2 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Redo Outfit Change"
          >
              <RedoIcon className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Top Right Actions: Save, Share, Download */}
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button 
            onClick={onSave}
            disabled={isLoading}
            className="p-2.5 bg-white/60 border border-gray-300/80 text-gray-700 rounded-full hover:bg-white transition-all backdrop-blur-sm"
            title="Save to Favorites"
        >
            <HeartIcon className="w-5 h-5" />
        </button>
        <button 
            onClick={shareOutfit}
            disabled={isLoading}
            className="p-2.5 bg-white/60 border border-gray-300/80 text-gray-700 rounded-full hover:bg-white transition-all backdrop-blur-sm relative"
            title="Share Outfit"
        >
            <ShareIcon className="w-5 h-5" />
            <AnimatePresence>
              {isShareSuccess && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-[10px] px-2 py-1 rounded"
                >
                  Link Copied!
                </motion.span>
              )}
            </AnimatePresence>
        </button>
        <button 
            onClick={downloadImage}
            disabled={isLoading}
            className="p-2.5 bg-white/60 border border-gray-300/80 text-gray-700 rounded-full hover:bg-white transition-all backdrop-blur-sm"
            title="Download Image"
        >
            <DownloadIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl}
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-serif text-gray-600 mt-4">Loading Model...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {displayImageUrl && !isLoading && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onMouseEnter={() => setIsPoseMenuOpen(true)}
          onMouseLeave={() => setIsPoseMenuOpen(false)}
        >
          <AnimatePresence>
              {isPoseMenuOpen && (
                  <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute bottom-full mb-3 w-64 bg-white/80 backdrop-blur-lg rounded-xl p-2 border border-gray-200/80 shadow-lg"
                  >
                      <div className="grid grid-cols-2 gap-2">
                          {poseInstructions.map((pose, index) => (
                              <button
                                  key={pose}
                                  onClick={() => onSelectPose(index)}
                                  disabled={isLoading || index === currentPoseIndex}
                                  className="w-full text-left text-xs font-medium text-gray-800 p-2 rounded-md hover:bg-gray-200/70 disabled:opacity-50 disabled:font-bold disabled:cursor-not-allowed"
                              >
                                  {pose}
                              </button>
                          ))}
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
          
          <div className="flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-2 border border-gray-300/50 shadow-sm">
            <button 
              onClick={handlePreviousPose}
              className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-800" />
            </button>
            <span className="text-sm font-semibold text-gray-800 w-48 text-center truncate" title={poseInstructions[currentPoseIndex]}>
              {poseInstructions[currentPoseIndex]}
            </span>
            <button 
              onClick={handleNextPose}
              className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
