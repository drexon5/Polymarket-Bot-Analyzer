import React, { useState, useCallback } from 'react';
import { UploadCloud, CheckCircle, X, AlertCircle } from 'lucide-react';

interface DataInputProps {
  onProcess: (portfolio: string, chat: string) => void;
}

interface DropZoneProps {
  label: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({ label, description, file, onFileSelect, onClear }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  if (file) {
    return (
      <div className="relative flex items-center justify-between p-4 bg-gray-800 border border-green-500/50 rounded-lg group transition-all">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-green-500/10 rounded-full text-green-500">
                <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
                <span className="text-sm text-white truncate" title={file.name}>{file.name}</span>
            </div>
        </div>
        <button 
            onClick={onClear}
            className="p-1 hover:bg-gray-700 rounded-full text-gray-500 hover:text-red-400 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <label 
      className={`
        relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all h-40
        ${isDragOver 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 bg-gray-900/50 hover:bg-gray-800 hover:border-gray-500'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <UploadCloud className={`w-8 h-8 ${isDragOver ? 'text-blue-400' : 'text-gray-400'}`} />
        <div>
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
      <input 
        type="file" 
        className="hidden" 
        accept=".csv,.txt"
        onChange={handleFileChange} 
      />
    </label>
  );
};

export const DataInput: React.FC<DataInputProps> = ({ onProcess }) => {
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [isReading, setIsReading] = useState(false);

  const handleProcessClick = async () => {
    if (!portfolioFile || !chatFile) return;

    setIsReading(true);
    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    try {
        const [portfolioContent, chatContent] = await Promise.all([
            readFile(portfolioFile),
            readFile(chatFile)
        ]);
        onProcess(portfolioContent, chatContent);
    } catch (error) {
        console.error("Error reading files", error);
        alert("Failed to read one or more files.");
    } finally {
        setIsReading(false);
    }
  };

  const isReady = portfolioFile && chatFile;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DropZone 
            label="Portfolio Export" 
            description="CSV with Categories (1_OPEN, 3_ACTIVITY...)"
            file={portfolioFile} 
            onFileSelect={setPortfolioFile} 
            onClear={() => setPortfolioFile(null)} 
        />
        <DropZone 
            label="Chat Logs" 
            description="Exported chat logs CSV"
            file={chatFile} 
            onFileSelect={setChatFile} 
            onClear={() => setChatFile(null)} 
        />
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleProcessClick}
          disabled={!isReady || isReading}
          className={`
            flex items-center gap-2 px-8 py-3 rounded-lg font-semibold shadow-lg transition-all
            ${isReady 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
            }
          `}
        >
          {isReading ? 'Reading Files...' : 'Process Files'}
        </button>
      </div>

      {!isReady && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <AlertCircle className="w-3 h-3" />
            Please upload both files to proceed.
        </div>
      )}
    </div>
  );
};