import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { enhanceFireAlert } from '@/components/services/FireAlertService';

export default function AddTestAlertDialog({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const [useAI, setUseAI] = useState(true);
  const [formData, setFormData] = useState({
    source: 'TestProvider',
    external_id: `test_${Date.now()}`,
    headline: 'Structure Fire Reported',
    description: 'Smoke visible from nearby area',
    address_text: '101 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    lat: '',
    lon: '',
    severity: '',
    confidence: '',
    event_type: 'structure_fire'
  });

  const { data: existingAlerts = [] } = useQuery({
    queryKey: ['fireAlerts', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) return [];
      return await base44.entities.FireAlert.list('-received_at', 100);
    },
    enabled: !!user?.company_id && open,
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data) => await base44.entities.FireAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fireAlerts']);
      onClose();
      setFormData({
        source: 'TestProvider',
        external_id: `test_${Date.now()}`,
        headline: 'Structure Fire Reported',
        description: 'Smoke visible from nearby area',
        address_text: '101 Main St',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        lat: '',
        lon: '',
        severity: '',
        confidence: '',
        event_type: 'structure_fire'
      });
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let alertData = {
      company_id: user.company_id,
      source: formData.source,
      external_id: formData.external_id,
      status: 'New',
      event_type: formData.event_type,
      headline: formData.headline,
      description: formData.description,
      address_text: formData.address_text,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lon: formData.lon ? parseFloat(formData.lon) : null,
      severity: formData.severity || null,
      confidence: formData.confidence ? parseFloat(formData.confidence) : null,
      occurred_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      raw: { test: true, ...formData }
    };

    // Use AI enhancement if enabled
    if (useAI) {
      alertData = await enhanceFireAlert(alertData, existingAlerts);
    }

    await createAlertMutation.mutateAsync(alertData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Test Fire Alert</DialogTitle>
          <DialogDescription>
            Create a test fire alert for development and testing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex items-center space-x-2 p-3 bg-indigo-50 rounded-lg">
            <Checkbox 
              id="useAI" 
              checked={useAI} 
              onCheckedChange={setUseAI}
            />
            <Label htmlFor="useAI" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Use AI to enhance alert (analyze severity, geocode, detect duplicates)
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Provider/Source</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                placeholder="e.g., FireHub"
              />
            </div>
            <div>
              <Label>External ID</Label>
              <Input
                value={formData.external_id}
                onChange={(e) => setFormData({...formData, external_id: e.target.value})}
                placeholder="Unique alert ID"
              />
            </div>
          </div>

          <div>
            <Label>Headline</Label>
            <Input
              value={formData.headline}
              onChange={(e) => setFormData({...formData, headline: e.target.value})}
              placeholder="Structure fire reported"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Details about the fire..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Type</Label>
              <Input
                value={formData.event_type}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                placeholder="structure_fire"
              />
            </div>
            <div>
              <Label>Severity {useAI && !formData.severity && <span className="text-xs text-indigo-600">(AI will suggest)</span>}</Label>
              <Select value={formData.severity} onValueChange={(val) => setFormData({...formData, severity: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Leave empty for AI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Auto (AI)</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={formData.address_text}
              onChange={(e) => setFormData({...formData, address_text: e.target.value})}
              placeholder="101 Main St"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
            <div>
              <Label>Zip</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({...formData, zip: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Latitude {useAI && !formData.lat && <span className="text-xs text-indigo-600">(AI will geocode)</span>}</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.lat}
                onChange={(e) => setFormData({...formData, lat: e.target.value})}
                placeholder={useAI ? "Leave empty for AI geocoding" : ""}
              />
            </div>
            <div>
              <Label>Longitude {useAI && !formData.lon && <span className="text-xs text-indigo-600">(AI will geocode)</span>}</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.lon}
                onChange={(e) => setFormData({...formData, lon: e.target.value})}
                placeholder={useAI ? "Leave empty for AI geocoding" : ""}
              />
            </div>
          </div>

          <div>
            <Label>Confidence (0-1) {useAI && !formData.confidence && <span className="text-xs text-indigo-600">(AI will calculate)</span>}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.confidence}
              onChange={(e) => setFormData({...formData, confidence: e.target.value})}
              placeholder={useAI ? "Leave empty for AI analysis" : ""}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAlertMutation.isPending}>
              {createAlertMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Alert
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}