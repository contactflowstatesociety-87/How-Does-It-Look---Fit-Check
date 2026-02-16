
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import type { WardrobeItem, SavedOutfit } from '../types';
import { UploadCloudIcon, CheckCircleIcon, HeartIcon } from './icons';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  onLoadSavedOutfit: (saved: SavedOutfit) => void;
}

const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context.'));
            ctx.drawImage(image, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas toBlob failed.'));
                const file = new File([blob], filename, { type: blob.type || 'image/png' });
                resolve(file);
            }, 'image/png');
        };
        image.onerror = (error) => reject(new Error(`Could not load image: ${error}`));
        image.src = url;
    });
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ 
    onGarmentSelect, 
    activeGarmentIds, 
    isLoading, 
    wardrobe,
    savedOutfits,
    onLoadSavedOutfit
}) => {
    const [error, setError] = useState<string | null>(null);

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            setError(`Failed to load item. This might be a CORS issue.`);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
            };
            onGarmentSelect(file, customGarmentInfo);
        }
    };

  return (
    <div className="flex flex-col gap-6">
        <div className="pt-6 border-t border-gray-400/50">
            <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                Wardrobe
            </h2>
            <div className="grid grid-cols-3 gap-3">
                {wardrobe.map((item) => {
                    const isActive = activeGarmentIds.includes(item.id);
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleGarmentClick(item)}
                            disabled={isLoading || isActive}
                            className="relative aspect-square border rounded-lg overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-gray-800 group disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-[10px] font-bold text-center p-1">{item.name}</p>
                            </div>
                            {isActive && (
                                <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                                    <CheckCircleIcon className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </button>
                    );
                })}
                <label htmlFor="custom-garment-upload" className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'hover:border-gray-900 hover:text-gray-900 cursor-pointer'}`}>
                    <UploadCloudIcon className="w-5 h-5 mb-1"/>
                    <span className="text-[10px] text-center font-bold">Upload</span>
                    <input id="custom-garment-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isLoading}/>
                </label>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {savedOutfits.length > 0 && (
            <div className="pt-6 border-t border-gray-400/50">
                <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                    <HeartIcon className="w-5 h-5 text-red-500 fill-red-500" /> Favorites
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    {savedOutfits.map((saved) => (
                        <button
                            key={saved.id}
                            onClick={() => onLoadSavedOutfit(saved)}
                            disabled={isLoading}
                            className="flex flex-col gap-2 p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 w-full">
                                <img src={saved.previewUrl} alt={saved.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-700 truncate w-full text-left" title={saved.name}>
                                {saved.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default WardrobePanel;
