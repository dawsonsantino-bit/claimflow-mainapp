import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff, FileIcon, FileText, Upload, X, CheckCircle2, Image } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';
import { FILE_LIMITS } from '@/components/AppConfig';
import { toast } from 'sonner';

const ALLOWED_TYPES = [
  ...FILE_LIMITS.ALLOWED_IMAGE_TYPES,
  ...FILE_LIMITS.ALLOWED_PDF_TYPES,
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(url);
}

function FilePreviewCard({ photo, isHomeowner, onToggleVisibility }) {
  const image = isImage(photo.url);
  return (
    <Card className="overflow-hidden group">
      <div className="aspect-square bg-slate-100 relative">
        {image ? (
          <img src={photo.url} alt={photo.photo_type} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <FileText className="w-10 h-10" />
            <span className="text-[10px] uppercase font-semibold tracking-wide">
              {photo.url.split('.').pop()?.toUpperCase() || 'DOC'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary" asChild>
            <a href={photo.url} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded">
            {photo.photo_type}
          </span>
          {!isHomeowner && (
            <button
              onClick={() => onToggleVisibility(photo)}
              className={`text-xs flex items-center gap-1 ${photo.visible_to_homeowner ? 'text-green-600' : 'text-slate-400'}`}
            >
              {photo.visible_to_homeowner ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {photo.visible_to_homeowner ? 'Public' : 'Private'}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">
          {new Date(photo.created_date).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}

function DropZone({ photoType, onFilesAdded, isUploading }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const validateFiles = (files) => {
    const valid = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" — unsupported file type.`);
        continue;
      }
      const maxSize = FILE_LIMITS.ALLOWED_PDF_TYPES.includes(file.type)
        ? FILE_LIMITS.PDF_MAX_SIZE
        : FILE_LIMITS.IMAGE_MAX_SIZE;
      if (file.size > maxSize) {
        toast.error(`"${file.name}" is too large.`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = validateFiles(Array.from(e.dataTransfer.files));
    if (files.length) onFilesAdded(files);
  }, [onFilesAdded]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e) => {
    const files = validateFiles(Array.from(e.target.files));
    if (files.length) onFilesAdded(files);
    e.target.value = '';
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isUploading && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
        ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}
        ${isUploading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
      {isUploading ? (
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
          <p className="text-sm font-semibold text-slate-700">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-slate-400">or click to browse</p>
          <div className="flex gap-2 mt-2 flex-wrap justify-center">
            {['Photos', 'PDFs', 'Receipts', 'Documents'].map(t => (
              <span key={t} className="text-xs bg-white border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-500 flex items-center gap-1">
                {t === 'Photos' ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobPhotos({ job, user }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [photoType, setPhotoType] = useState("Before");
  const [uploadQueue, setUploadQueue] = useState([]); // {file, status: 'pending'|'done'|'error'}

  const { data: photos, isLoading } = useQuery({
    queryKey: ['jobPhotos', job.id],
    queryFn: () => base44.entities.JobPhoto.list({ job_id: job.id }, { created_date: -1 }),
  });

  const handleFilesAdded = async (files) => {
    const queue = files.map(f => ({ file: f, status: 'pending', name: f.name }));
    setUploadQueue(queue);
    setIsUploading(true);

    const results = [];
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
        await base44.entities.JobPhoto.create({
          job_id: job.id,
          uploaded_by_user_id: user.id,
          url: file_url,
          photo_type: photoType,
          visible_to_homeowner: false,
        });
        results.push({ ...item, status: 'done' });
      } catch {
        results.push({ ...item, status: 'error' });
      }
      setUploadQueue([...results, ...queue.slice(i + 1)]);
    }

    const successCount = results.filter(r => r.status === 'done').length;
    const failCount = results.filter(r => r.status === 'error').length;

    if (successCount) toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`);
    if (failCount) toast.error(`${failCount} file${failCount > 1 ? 's' : ''} failed to upload`);

    queryClient.invalidateQueries(['jobPhotos', job.id]);
    setTimeout(() => setUploadQueue([]), 2000);
    setIsUploading(false);
  };

  const toggleVisibility = async (photo) => {
    try {
      await base44.entities.JobPhoto.update(photo.id, {
        visible_to_homeowner: !photo.visible_to_homeowner,
      });
      queryClient.invalidateQueries(['jobPhotos', job.id]);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const isHomeowner = user.business_role === USER_ROLES.Homeowner;
  const displayedPhotos = isHomeowner ? photos?.filter(p => p.visible_to_homeowner) : photos;

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin" />;

  return (
    <div className="space-y-6">
      {!isHomeowner && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Upload Files</h3>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-slate-500 whitespace-nowrap">Category:</Label>
                <Select value={photoType} onValueChange={setPhotoType}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Before">Before Damage</SelectItem>
                    <SelectItem value="During">During Work</SelectItem>
                    <SelectItem value="After">After Completion</SelectItem>
                    <SelectItem value="Swab">Swab / Lab</SelectItem>
                    <SelectItem value="Other">Receipt / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DropZone photoType={photoType} onFilesAdded={handleFilesAdded} isUploading={isUploading} />

            {/* Upload Queue Progress */}
            {uploadQueue.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {uploadQueue.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm px-1">
                    {item.status === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />}
                    {item.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                    {item.status === 'error' && <X className="w-4 h-4 text-red-500 shrink-0" />}
                    <span className={`truncate ${item.status === 'error' ? 'text-red-500' : 'text-slate-600'}`}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedPhotos?.map((photo) => (
          <FilePreviewCard
            key={photo.id}
            photo={photo}
            isHomeowner={isHomeowner}
            onToggleVisibility={toggleVisibility}
          />
        ))}

        {(!displayedPhotos || displayedPhotos.length === 0) && (
          <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed rounded-lg">
            No photos or documents found.
          </div>
        )}
      </div>
    </div>
  );
}