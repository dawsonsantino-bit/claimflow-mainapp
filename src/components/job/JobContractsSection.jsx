import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

function ContractSlot({ label, fileUrl, signedAt, onFileUpload, onSignedDateChange, uploading, readonly }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800 text-sm">{label}</h4>
        {signedAt ? (
          <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Signed
          </Badge>
        ) : (
          <Badge variant="outline" className="text-slate-500">Not Signed</Badge>
        )}
      </div>

      {fileUrl ? (
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="truncate text-slate-700 flex-1">Contract uploaded</span>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 shrink-0">
            <ExternalLink className="w-3 h-3" /> View
          </a>
        </div>
      ) : (
        !readonly && (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400 mb-1" />
            ) : (
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
            )}
            <span className="text-xs text-slate-500">{uploading ? 'Uploading...' : 'Click to upload PDF/document'}</span>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={onFileUpload} disabled={uploading} />
          </label>
        )
      )}

      {!readonly && (
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Signed Date</Label>
          <Input
            type="datetime-local"
            value={signedAt ? signedAt.slice(0, 16) : ''}
            onChange={e => onSignedDateChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            className="text-sm"
          />
        </div>
      )}

      {readonly && signedAt && (
        <p className="text-xs text-slate-500">Signed: {new Date(signedAt).toLocaleString()}</p>
      )}
    </div>
  );
}

export default function JobContractsSection({ job, user, readonly = false }) {
  const queryClient = useQueryClient();
  const [uploadingA, setUploadingA] = useState(false);
  const [uploadingB, setUploadingB] = useState(false);

  const save = async (updates) => {
    await base44.entities.Job.update(job.id, updates);
    queryClient.invalidateQueries({ queryKey: ['job', job.id] });
    toast.success('Saved');
  };

  const handleUpload = async (field, setUploading, file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await save({ [field]: file_url });
    setUploading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contracts</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContractSlot
          label="Contract A — Law Firm"
          fileUrl={job.law_firm_contract_file}
          signedAt={job.law_firm_contract_signed_at}
          uploading={uploadingA}
          readonly={readonly}
          onFileUpload={e => handleUpload('law_firm_contract_file', setUploadingA, e.target.files[0])}
          onSignedDateChange={val => save({ law_firm_contract_signed_at: val })}
        />
        <ContractSlot
          label="Contract B — Hygienist / Work Order"
          fileUrl={job.hygienist_contract_file}
          signedAt={job.hygienist_contract_signed_at}
          uploading={uploadingB}
          readonly={readonly}
          onFileUpload={e => handleUpload('hygienist_contract_file', setUploadingB, e.target.files[0])}
          onSignedDateChange={val => save({ hygienist_contract_signed_at: val })}
        />
      </CardContent>
    </Card>
  );
}