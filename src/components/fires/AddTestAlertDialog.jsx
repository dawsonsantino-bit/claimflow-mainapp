import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Loader2, CheckCircle } from 'lucide-react';

export default function AddTestAlertDialog({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    source: 'TestProvider',
    external_id: `test_${Date.now()}`,
    headline: 'Structure Fire Reported',
    description: 'Smoke visible from nearby area',
    address_text: '101 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    lat: '30.2672',
    lon: '-97.7431',
    severity: 'high',
    confidence: '0.9',
    event_type: 'structure_fire'
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
        lat: '30.2672',
        lon: '-97.7431',
        severity: 'high',
        confidence: '0.9',
        event_type: 'structure_fire'
      });
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const alertData = {
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
      lat: parseFloat(formData.lat),
      lon: parseFloat(formData.lon),
      severity: formData.severity,
      confidence: parseFloat(formData.confidence),
      occurred_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      raw: { test: true, ...formData }
    };

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
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(val) => setFormData({...formData, severity: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <Label>Latitude</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.lat}
                onChange={(e) => setFormData({...formData, lat: e.target.value})}
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.lon}
                onChange={(e) => setFormData({...formData, lon: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Confidence (0-1)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.confidence}
              onChange={(e) => setFormData({...formData, confidence: e.target.value})}
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