import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Eye, EyeOff, Trash2, FileIcon, ImageIcon } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';

export default function JobPhotos({ job, user }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [photoType, setPhotoType] = useState("Before");
  
  const { data: photos, isLoading } = useQuery({
    queryKey: ['jobPhotos', job.id],
    queryFn: () => base44.entities.JobPhoto.list({ job_id: job.id }, { created_date: -1 }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.JobPhoto.create({
        job_id: job.id,
        uploaded_by_user_id: user.id,
        url: file_url,
        photo_type: photoType,
        visible_to_homeowner: false // Default to private
      });
      
      queryClient.invalidateQueries(['jobPhotos', job.id]);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleVisibility = async (photo) => {
    try {
      await base44.entities.JobPhoto.update(photo.id, {
        visible_to_homeowner: !photo.visible_to_homeowner
      });
      queryClient.invalidateQueries(['jobPhotos', job.id]);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const isHomeowner = user.business_role === USER_ROLES.Homeowner;
  const displayedPhotos = isHomeowner 
    ? photos?.filter(p => p.visible_to_homeowner) 
    : photos;

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin" />;

  return (
    <div className="space-y-6">
      {!isHomeowner && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-medium">Upload New Photo/Document</h3>
            <div className="flex gap-4 items-end">
              <div className="space-y-2 w-48">
                <Label>Type</Label>
                <Select value={photoType} onValueChange={setPhotoType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Before">Before Damage</SelectItem>
                    <SelectItem value="During">During Work</SelectItem>
                    <SelectItem value="After">After Completion</SelectItem>
                    <SelectItem value="Swab">Swab/Lab</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label>File</Label>
                <div className="relative">
                  <Input 
                    type="file" 
                    onChange={handleUpload} 
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  {isUploading && <Loader2 className="absolute right-3 top-2 w-5 h-5 animate-spin text-slate-400" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedPhotos?.map((photo) => (
          <Card key={photo.id} className="overflow-hidden group">
            <div className="aspect-square bg-slate-100 relative">
              {photo.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={photo.url} alt={photo.photo_type} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <FileIcon className="w-12 h-12" />
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
              <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded">
                   {photo.photo_type}
                 </span>
                 {!isHomeowner && (
                   <button 
                     onClick={() => toggleVisibility(photo)}
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