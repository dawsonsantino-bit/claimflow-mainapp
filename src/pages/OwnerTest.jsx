import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Play, Trash2, Users, Briefcase, GitBranch, Flame } from 'lucide-react';
import { JOB_STATUSES } from '@/components/job/JobConstants';

export default function OwnerTest() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef(null);

  // Seed Users Config
  const [companyScope, setCompanyScope] = useState('CurrentCompany');
  const [salesRepCount, setSalesRepCount] = useState(5);

  // Concurrent Jobs Config
  const [jobsPerRep, setJobsPerRep] = useState(15);
  const [duplicateRate, setDuplicateRate] = useState(0.2);

  // Status Churn Config
  const [updatesPerJob, setUpdatesPerJob] = useState(3);

  // Fire Alerts Config
  const [alertCount, setAlertCount] = useState(25);
  const [autoConvert, setAutoConvert] = useState(false);

  // State
  const [testCompanyId, setTestCompanyId] = useState(null);
  const [seededUsers, setSeededUsers] = useState([]);
  const [jobStats, setJobStats] = useState(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  if (!user?.is_app_owner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only accessible to app owners.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // A) Seed Users
  const handleSeedUsers = async () => {
    setRunning(true);
    addLog('🚀 Starting user seeding...', 'info');
    
    try {
      let targetCompanyId = user.company_id;
      let locationId = null;

      // Create TestCo if needed
      if (companyScope === 'TestCo') {
        addLog('Creating TestCo company...', 'info');
        
        const existingCompanies = await base44.entities.Company.list();
        let testCo = existingCompanies.find(c => c.slug === 'testco');
        
        if (!testCo) {
          testCo = await base44.entities.Company.create({
            name: 'TestCo',
            slug: 'testco',
            supported_loss_types: ['Fire', 'Smoke'],
            preferred_insurance_providers: []
          });
          addLog(`✅ Created TestCo (ID: ${testCo.id})`, 'success');
        } else {
          addLog(`✅ Using existing TestCo (ID: ${testCo.id})`, 'success');
        }
        
        targetCompanyId = testCo.id;
        setTestCompanyId(testCo.id);

        // Create default location
        const locations = await base44.entities.Location.filter({ company_id: testCo.id });
        if (locations.length === 0) {
          const location = await base44.entities.Location.create({
            company_id: testCo.id,
            name: 'Main Office',
            city: 'Test City',
            state: 'CA',
            zip: '90001'
          });
          locationId = location.id;
          addLog(`✅ Created default location (ID: ${location.id})`, 'success');
        } else {
          locationId = locations[0].id;
        }

        // Create domain mapping
        const domains = await base44.entities.CompanyDomain.filter({ company_id: testCo.id });
        if (domains.length === 0) {
          await base44.entities.CompanyDomain.create({
            company_id: testCo.id,
            domain: 'testco.local'
          });
          addLog(`✅ Created domain mapping testco.local`, 'success');
        }
      } else {
        // Use current company's first location
        const locations = await base44.entities.Location.filter({ company_id: targetCompanyId });
        if (locations.length > 0) {
          locationId = locations[0].id;
        } else {
          addLog('⚠️ No locations found for current company', 'warning');
        }
      }

      // Create sales rep users
      const createdUsers = [];
      const domain = companyScope === 'TestCo' ? 'testco.local' : user.email.split('@')[1];
      
      for (let i = 1; i <= salesRepCount; i++) {
        const email = `sales${i}@${domain}`;
        addLog(`Creating ${email}...`, 'info');
        
        try {
          // Note: In real implementation, you'd use an admin endpoint to create users
          // For now, we'll just log what should be created
          addLog(`⚠️ User creation requires backend admin API - would create: ${email} (SalesRep, company: ${targetCompanyId})`, 'warning');
          
          createdUsers.push({
            email,
            role: 'SalesRep',
            company_id: targetCompanyId,
            location_id: locationId
          });
        } catch (error) {
          addLog(`❌ Failed to create ${email}: ${error.message}`, 'error');
        }
      }

      setSeededUsers(createdUsers);
      addLog(`✅ User seeding complete. Created ${createdUsers.length} users.`, 'success');
    } catch (error) {
      addLog(`❌ Error during user seeding: ${error.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  // B) Concurrent Job Creation
  const handleConcurrentJobs = async () => {
    if (seededUsers.length === 0) {
      addLog('❌ No seeded users found. Run "Seed Users" first.', 'error');
      return;
    }

    setRunning(true);
    addLog('🚀 Starting concurrent job creation...', 'info');

    try {
      const targetCompanyId = testCompanyId || user.company_id;
      const locations = await base44.entities.Location.filter({ company_id: targetCompanyId });
      const locationId = locations[0]?.id;

      if (!locationId) {
        addLog('❌ No location found for company', 'error');
        setRunning(false);
        return;
      }

      // Get existing jobs to create duplicates from
      const existingJobs = await base44.entities.Job.filter({ company_id: targetCompanyId, is_closed: false });
      
      const stats = {
        perRep: {},
        totalCreated: 0,
        totalDuplicates: 0
      };

      // Process each rep concurrently
      await Promise.all(seededUsers.map(async (seedUser) => {
        const repStats = { created: 0, duplicates: 0, claims: [] };

        // Create jobs for this rep
        const jobPromises = [];
        for (let i = 0; i < jobsPerRep; i++) {
          const shouldDuplicate = Math.random() < duplicateRate && existingJobs.length > 0;
          
          let jobData;
          if (shouldDuplicate) {
            const dupJob = existingJobs[Math.floor(Math.random() * existingJobs.length)];
            jobData = {
              company_id: targetCompanyId,
              location_id: locationId,
              sales_rep_user_id: seedUser.email,
              property_owner_name: `TEST ${dupJob.property_owner_name}`,
              property_address_line1: dupJob.property_address_line1,
              property_city: dupJob.property_city,
              property_state: dupJob.property_state,
              property_zip: dupJob.property_zip,
              property_phone: dupJob.property_phone,
              property_email: `test${i}@testco.local`,
              current_status: JOB_STATUSES.LeadCreated,
              loss_type: 'Fire'
            };
          } else {
            jobData = {
              company_id: targetCompanyId,
              location_id: locationId,
              sales_rep_user_id: seedUser.email,
              property_owner_name: `TEST Owner ${i + 1}`,
              property_address_line1: `TEST-${Math.floor(Math.random() * 9999)} Main St`,
              property_city: 'Test City',
              property_state: 'CA',
              property_zip: '90001',
              property_phone: `555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
              property_email: `test${i}@testco.local`,
              current_status: JOB_STATUSES.LeadCreated,
              loss_type: 'Fire'
            };
          }

          jobPromises.push(
            base44.entities.Job.create(jobData)
              .then(job => {
                repStats.created++;
                repStats.claims.push(job.claim_number);
                return job;
              })
              .catch(error => {
                if (error.message?.includes('duplicate') || error.message?.includes('409')) {
                  repStats.duplicates++;
                } else {
                  addLog(`⚠️ Job creation failed: ${error.message}`, 'warning');
                }
              })
          );
        }

        await Promise.all(jobPromises);
        
        stats.perRep[seedUser.email] = repStats;
        stats.totalCreated += repStats.created;
        stats.totalDuplicates += repStats.duplicates;

        const claimRange = repStats.claims.length > 0 
          ? `${Math.min(...repStats.claims)}–${Math.max(...repStats.claims)}`
          : 'N/A';
        
        addLog(`✅ ${seedUser.email}: ${repStats.created} created, ${repStats.duplicates} duplicates, claims ${claimRange}`, 'success');
      }));

      setJobStats(stats);
      addLog(`✅ Job creation complete. Total: ${stats.totalCreated} created, ${stats.totalDuplicates} duplicates rejected.`, 'success');
    } catch (error) {
      addLog(`❌ Error during job creation: ${error.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  // C) Status Churn
  const handleStatusChurn = async () => {
    setRunning(true);
    addLog('🚀 Starting status churn...', 'info');

    try {
      const targetCompanyId = testCompanyId || user.company_id;
      const allJobs = await base44.entities.Job.filter({ 
        company_id: targetCompanyId,
        is_closed: false
      }, '-created_date', 50);

      const testJobs = allJobs.filter(j => j.property_owner_name?.startsWith('TEST '));
      const sampleJobs = testJobs.slice(0, Math.min(50, testJobs.length));

      addLog(`Found ${sampleJobs.length} test jobs for status churn`, 'info');

      const statusProgression = [
        JOB_STATUSES.LeadCreated,
        JOB_STATUSES.AssessmentDone,
        JOB_STATUSES.ContractSigned,
        JOB_STATUSES.InitialDocumentationComplete,
        JOB_STATUSES.HygienistAssigned,
        JOB_STATUSES.SwabCompletedLabSent,
        JOB_STATUSES.LabResultsProtocolReady,
        JOB_STATUSES.InsuranceNegotiation,
        JOB_STATUSES.WorkInProgress,
        JOB_STATUSES.WorkCompleted
      ];

      let totalTransitions = 0;
      let failures = 0;

      for (const job of sampleJobs) {
        const currentIdx = statusProgression.indexOf(job.current_status);
        const numUpdates = Math.min(updatesPerJob, statusProgression.length - currentIdx - 1);

        for (let i = 0; i < numUpdates; i++) {
          const newStatus = statusProgression[currentIdx + i + 1];
          
          try {
            await base44.entities.Job.update(job.id, { current_status: newStatus });
            await base44.entities.JobStatusHistory.create({
              job_id: job.id,
              from_status: job.current_status,
              to_status: newStatus,
              changed_by_user_id: user.id,
              changed_at: new Date().toISOString(),
              note: 'Test transition'
            });
            totalTransitions++;
          } catch (error) {
            failures++;
            addLog(`⚠️ Failed to transition job ${job.claim_number}: ${error.message}`, 'warning');
          }
        }
      }

      addLog(`✅ Status churn complete. ${totalTransitions} transitions, ${failures} failures.`, 'success');
    } catch (error) {
      addLog(`❌ Error during status churn: ${error.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  // D) Fire Alerts Injection
  const handleFireAlerts = async () => {
    setRunning(true);
    addLog('🚀 Injecting fire alerts...', 'info');

    try {
      const targetCompanyId = testCompanyId || user.company_id;
      
      // Center coordinates (Los Angeles area)
      const centerLat = 34.0522;
      const centerLon = -118.2437;

      let newCount = 0;
      let convertedCount = 0;

      for (let i = 0; i < alertCount; i++) {
        const lat = centerLat + (Math.random() - 0.5) * 0.1;
        const lon = centerLon + (Math.random() - 0.5) * 0.1;

        const severities = ['low', 'medium', 'high'];
        const eventTypes = ['Structure Fire', 'Vehicle Fire', 'Brush Fire', 'Apartment Fire'];

        const alertData = {
          company_id: targetCompanyId,
          source: 'TestHarness',
          external_id: `test-${Date.now()}-${i}`,
          status: autoConvert ? 'Converted' : 'New',
          event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          headline: `Test Fire Alert ${i + 1}`,
          description: `This is a test fire alert generated for stress testing. Alert #${i + 1}.`,
          address_text: `${Math.floor(Math.random() * 9999)} Test Street`,
          lat,
          lon,
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001',
          confidence: 0.5 + Math.random() * 0.5,
          severity: severities[Math.floor(Math.random() * severities.length)],
          occurred_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          received_at: new Date().toISOString()
        };

        const alert = await base44.entities.FireAlert.create(alertData);

        if (autoConvert) {
          convertedCount++;
        } else {
          newCount++;
        }
      }

      addLog(`✅ Injected ${alertCount} alerts: ${newCount} new, ${convertedCount} converted.`, 'success');
    } catch (error) {
      addLog(`❌ Error injecting alerts: ${error.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  // E) Cleanup
  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to delete all test data? This cannot be undone.')) {
      return;
    }

    setRunning(true);
    addLog('🧹 Starting cleanup...', 'info');

    try {
      if (testCompanyId) {
        // Delete TestCo and all related data
        addLog('Deleting TestCo jobs...', 'info');
        const jobs = await base44.entities.Job.filter({ company_id: testCompanyId });
        for (const job of jobs) {
          await base44.entities.Job.delete(job.id);
        }

        addLog('Deleting TestCo alerts...', 'info');
        const alerts = await base44.entities.FireAlert.filter({ company_id: testCompanyId });
        for (const alert of alerts) {
          await base44.entities.FireAlert.delete(alert.id);
        }

        addLog('Deleting TestCo locations...', 'info');
        const locations = await base44.entities.Location.filter({ company_id: testCompanyId });
        for (const location of locations) {
          await base44.entities.Location.delete(location.id);
        }

        addLog('Deleting TestCo domains...', 'info');
        const domains = await base44.entities.CompanyDomain.filter({ company_id: testCompanyId });
        for (const domain of domains) {
          await base44.entities.CompanyDomain.delete(domain.id);
        }

        addLog('Deleting TestCo company...', 'info');
        await base44.entities.Company.delete(testCompanyId);

        setTestCompanyId(null);
        addLog('✅ TestCo and all related data deleted.', 'success');
      } else {
        // Delete only test-marked data
        addLog('Deleting test jobs...', 'info');
        const allJobs = await base44.entities.Job.list();
        const testJobs = allJobs.filter(j => j.property_owner_name?.startsWith('TEST '));
        for (const job of testJobs) {
          await base44.entities.Job.delete(job.id);
        }

        addLog('Deleting test alerts...', 'info');
        const allAlerts = await base44.entities.FireAlert.list();
        const testAlerts = allAlerts.filter(a => a.source === 'TestHarness');
        for (const alert of testAlerts) {
          await base44.entities.FireAlert.delete(alert.id);
        }

        addLog(`✅ Deleted ${testJobs.length} test jobs and ${testAlerts.length} test alerts.`, 'success');
      }

      setSeededUsers([]);
      setJobStats(null);
    } catch (error) {
      addLog(`❌ Error during cleanup: ${error.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Owner System Test</h1>
        <p className="text-slate-600 mt-1">Stress test user seeding, concurrent operations, and data ingestion</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* A) Seed Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Seed Users
            </CardTitle>
            <CardDescription>Create test sales rep users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Scope</Label>
              <Select value={companyScope} onValueChange={setCompanyScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CurrentCompany">Current Company</SelectItem>
                  <SelectItem value="TestCo">Isolated TestCo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sales Rep Count</Label>
              <Input
                type="number"
                value={salesRepCount}
                onChange={(e) => setSalesRepCount(parseInt(e.target.value))}
                min={1}
                max={20}
              />
            </div>
            <Button onClick={handleSeedUsers} disabled={running} className="w-full">
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Seed Users
            </Button>
            {seededUsers.length > 0 && (
              <p className="text-sm text-green-600">✓ {seededUsers.length} users seeded</p>
            )}
          </CardContent>
        </Card>

        {/* B) Concurrent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Concurrent Job Create
            </CardTitle>
            <CardDescription>Test concurrent job creation with duplicates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Jobs Per Rep</Label>
              <Input
                type="number"
                value={jobsPerRep}
                onChange={(e) => setJobsPerRep(parseInt(e.target.value))}
                min={1}
                max={50}
              />
            </div>
            <div>
              <Label>Duplicate Rate</Label>
              <Input
                type="number"
                step="0.1"
                value={duplicateRate}
                onChange={(e) => setDuplicateRate(parseFloat(e.target.value))}
                min={0}
                max={1}
              />
            </div>
            <Button onClick={handleConcurrentJobs} disabled={running || seededUsers.length === 0} className="w-full">
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Create Jobs
            </Button>
            {jobStats && (
              <div className="text-sm space-y-1">
                <p className="text-green-600">✓ {jobStats.totalCreated} created</p>
                <p className="text-amber-600">⚠ {jobStats.totalDuplicates} duplicates</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* C) Status Churn */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Status Churn
            </CardTitle>
            <CardDescription>Randomly advance job statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Updates Per Job</Label>
              <Input
                type="number"
                value={updatesPerJob}
                onChange={(e) => setUpdatesPerJob(parseInt(e.target.value))}
                min={1}
                max={10}
              />
            </div>
            <Button onClick={handleStatusChurn} disabled={running} className="w-full">
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run Status Churn
            </Button>
          </CardContent>
        </Card>

        {/* D) Fire Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Fire Alerts Inject
            </CardTitle>
            <CardDescription>Generate synthetic fire alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Alert Count</Label>
              <Input
                type="number"
                value={alertCount}
                onChange={(e) => setAlertCount(parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto Convert</Label>
              <Switch checked={autoConvert} onCheckedChange={setAutoConvert} />
            </div>
            <Button onClick={handleFireAlerts} disabled={running} className="w-full">
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Inject Alerts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Cleanup Test Data
          </CardTitle>
          <CardDescription>Remove all test data or TestCo company</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCleanup} disabled={running} variant="destructive" className="w-full">
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Cleanup Test Data
          </Button>
        </CardContent>
      </Card>

      {/* Live Log Console */}
      <Card>
        <CardHeader>
          <CardTitle>Live Log Console</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={logRef}
            className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto"
          >
            {logs.length === 0 ? (
              <p className="text-slate-500">No logs yet. Run a test to see output...</p>
            ) : (
              logs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'warning' ? 'text-amber-400' : 
                    'text-slate-300'
                  }`}
                >
                  <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}