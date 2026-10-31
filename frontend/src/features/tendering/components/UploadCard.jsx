import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/ui/tenderrank/utils';

const UploadCard = ({ onFileSelect, file, error, acceptedType = 'PDF' }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const _allowed = (f) => /\.(pdf|docx|doc)$/i.test(f.name);

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && _allowed(droppedFile)) {
      onFileSelect(droppedFile);
    }
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
  };

  return (
    <div
      onDragEnter={handleDrag} onDragOver={handleDrag}
      onDragLeave={handleDrag} onDrop={handleDrop}
      onClick={() => fileInputRef.current.click()}
      className={cn(
        'relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
        dragActive
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : file
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
      )}
    >
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={handleChange} />

      <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl mb-4', file ? 'bg-primary/10' : 'bg-muted')}>
        {file
          ? <CheckCircle2 className="h-7 w-7 text-primary" />
          : <UploadCloud className="h-7 w-7 text-muted-foreground" />
        }
      </div>

      {file ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
            <FileText size={15} className="text-primary" /> {file.name}
          </p>
          <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB — Ready to submit</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">
            Drop your {acceptedType} here, or{' '}
            <span className="text-primary underline underline-offset-2">browse files</span>
          </p>
          <p className="text-xs text-muted-foreground">PDF or Word document accepted (max 50MB)</p>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
    </div>
  );
};

export default UploadCard;
