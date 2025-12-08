import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeSliderProps {
  minDate: Date;
  maxDate: Date;
  onChange: (start: Date, end: Date) => void;
}

export const DateRangeSlider: React.FC<DateRangeSliderProps> = ({ minDate, maxDate, onChange }) => {
  const [minVal, setMinVal] = useState(minDate.getTime());
  const [maxVal, setMaxVal] = useState(maxDate.getTime());
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // When props change (new data loaded), reset state
  useEffect(() => {
    setMinVal(minDate.getTime());
    setMaxVal(maxDate.getTime());
  }, [minDate, maxDate]);

  const min = minDate.getTime();
  const max = maxDate.getTime();

  // Calculate percentage
  const getPercent = (value: number) => {
    return Math.round(((value - min) / (max - min)) * 100);
  };

  // Update track highlighting
  useEffect(() => {
    if (maxRef.current && minRef.current && trackRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxVal);

      if (trackRef.current) {
        trackRef.current.style.left = `${minPercent}%`;
        trackRef.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
    // Propagate changes
    onChange(new Date(minVal), new Date(maxVal));
  }, [minVal, maxVal, min, max]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-white">Filter by Date Range</span>
            </div>
            <div className="flex gap-4 font-mono text-xs">
                <span className="bg-gray-900 px-2 py-1 rounded border border-gray-700">
                    {new Date(minVal).toLocaleDateString()}
                </span>
                <span className="text-gray-500">-</span>
                <span className="bg-gray-900 px-2 py-1 rounded border border-gray-700">
                    {new Date(maxVal).toLocaleDateString()}
                </span>
            </div>
        </div>

        <div className="relative w-full h-8 flex items-center">
            {/* The Range Inputs */}
            <input
                type="range"
                min={min}
                max={max}
                value={minVal}
                ref={minRef}
                onChange={(event) => {
                    const value = Math.min(Number(event.target.value), maxVal - 86400000); // 1 day buffer
                    setMinVal(value);
                    event.target.value = value.toString();
                }}
                className="absolute w-full pointer-events-none appearance-none z-20 h-0 outline-none"
                style={{ zIndex: minVal > max - 100 ? 5 : 3 }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={maxVal}
                ref={maxRef}
                onChange={(event) => {
                    const value = Math.max(Number(event.target.value), minVal + 86400000);
                    setMaxVal(value);
                    event.target.value = value.toString();
                }}
                className="absolute w-full pointer-events-none appearance-none z-20 h-0 outline-none"
                style={{ zIndex: 4 }}
            />

            {/* The Visual Track */}
            <div className="relative w-full h-2 rounded-full bg-gray-700 z-10">
                <div ref={trackRef} className="absolute h-2 rounded-full bg-blue-500 z-10" />
            </div>
        </div>
        
        <style>{`
            /* Custom CSS for Dual Range Slider */
            input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none;
                pointer-events: all;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background-color: #f3f4f6; /* white */
                border: 2px solid #3b82f6; /* blue-500 */
                cursor: grab;
                margin-top: -8px; /* fix for chrome */
                position: relative;
                z-index: 50;
                transition: transform 0.1s ease;
            }
            input[type='range']::-webkit-slider-thumb:hover {
                transform: scale(1.1);
            }
            input[type='range']::-webkit-slider-thumb:active {
                cursor: grabbing;
                background-color: #e5e7eb;
            }
            input[type='range']::-moz-range-thumb {
                -webkit-appearance: none;
                pointer-events: all;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background-color: #f3f4f6;
                border: 2px solid #3b82f6;
                cursor: grab;
                position: relative;
                z-index: 50;
            }
        `}</style>
    </div>
  );
};