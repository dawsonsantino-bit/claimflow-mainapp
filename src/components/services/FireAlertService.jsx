import { base44 } from '@/api/base44Client';

/**
 * Analyzes alert text to suggest severity and confidence scores
 */
export async function analyzeAlertSeverity(headline, description, eventType) {
  try {
    const prompt = `Analyze this fire alert and provide severity and confidence scores:

Headline: ${headline || 'N/A'}
Description: ${description || 'N/A'}
Event Type: ${eventType || 'N/A'}

Based on the information, determine:
1. Severity: "high", "medium", or "low"
2. Confidence: A number between 0 and 1 (how confident you are in this being a legitimate fire incident)

Consider factors like:
- Explicit mentions of fire, smoke, flames
- Structural damage indicators
- Emergency response mentions
- Vague or unclear language (lower confidence)
- Specific details (higher confidence)`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string" }
        },
        required: ["severity", "confidence"]
      }
    });

    return {
      severity: result.severity,
      confidence: result.confidence,
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('Alert analysis failed:', error);
    return { severity: 'medium', confidence: 0.5, reasoning: 'Analysis failed, using defaults' };
  }
}

/**
 * Geocodes an address to lat/lon coordinates with enhanced precision
 */
export async function geocodeAddress(addressText, city, state, zip) {
  try {
    // Construct full address with priority components
    const addressComponents = [addressText, city, state, zip].filter(Boolean);
    const fullAddress = addressComponents.join(', ');
    
    if (!fullAddress.trim()) {
      return { lat: null, lon: null, formatted_address: null, confidence: 0, method: 'failed' };
    }
    
    const prompt = `You are a precision geocoding service. Geocode this address to exact latitude and longitude coordinates.

ADDRESS TO GEOCODE: ${fullAddress}

REQUIREMENTS:
1. Use real geocoding data from Google Maps, OpenStreetMap, or other reliable sources
2. Return coordinates with at least 6 decimal places for precision (~0.1 meter accuracy)
3. For ambiguous addresses, choose the most likely interpretation based on:
   - Complete street address > City center
   - Residential/commercial buildings > Intersections
   - USA locations (given state/zip context)
4. Validate the coordinates are reasonable for the given state/region
5. Return the properly formatted standardized address

HANDLING INCOMPLETE/AMBIGUOUS ADDRESSES:
- If only city/state: Return city center coordinates
- If street name without number: Return midpoint of that street
- If multiple matches exist: Choose the most populated/central location
- If address cannot be geocoded: Return null

Return high confidence (>0.8) only for precise street addresses with building numbers.
Return medium confidence (0.5-0.8) for street-level or landmark geocoding.
Return low confidence (<0.5) for city-level or ambiguous results.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          lat: { type: "number" },
          lon: { type: "number" },
          formatted_address: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          precision_level: { 
            type: "string", 
            enum: ["rooftop", "street", "city", "region", "unknown"] 
          },
          notes: { type: "string" }
        },
        required: ["lat", "lon", "confidence", "precision_level"]
      }
    });

    // Validate coordinates are reasonable
    const isValidCoords = result.lat && result.lon &&
                         result.lat >= -90 && result.lat <= 90 &&
                         result.lon >= -180 && result.lon <= 180;

    if (!isValidCoords) {
      console.warn('Invalid coordinates received:', result);
      return { 
        lat: null, 
        lon: null, 
        formatted_address: null, 
        confidence: 0, 
        method: 'validation_failed',
        error: 'Invalid coordinate range'
      };
    }

    return {
      lat: result.lat,
      lon: result.lon,
      formatted_address: result.formatted_address || fullAddress,
      confidence: result.confidence || 0.5,
      precision_level: result.precision_level || 'unknown',
      notes: result.notes,
      method: 'ai_enhanced'
    };
  } catch (error) {
    console.error('Geocoding failed:', error);
    return { 
      lat: null, 
      lon: null, 
      formatted_address: null, 
      confidence: 0, 
      method: 'error',
      error: error.message 
    };
  }
}

/**
 * Checks for duplicate alerts using AI clustering
 */
export async function findDuplicateAlerts(newAlert, existingAlerts) {
  try {
    if (!existingAlerts || existingAlerts.length === 0) {
      return { isDuplicate: false, matchedAlert: null };
    }

    // Filter to recent alerts (last 24 hours) in same general area
    const recentAlerts = existingAlerts.filter(alert => {
      const hoursDiff = (new Date() - new Date(alert.received_at)) / (1000 * 60 * 60);
      if (hoursDiff > 24) return false;
      
      // Basic proximity check if coordinates available
      if (newAlert.lat && newAlert.lon && alert.lat && alert.lon) {
        const distance = Math.sqrt(
          Math.pow(newAlert.lat - alert.lat, 2) + 
          Math.pow(newAlert.lon - alert.lon, 2)
        );
        return distance < 0.01; // ~1km radius
      }
      
      // Check if same city/state
      return alert.city === newAlert.city && alert.state === newAlert.state;
    });

    if (recentAlerts.length === 0) {
      return { isDuplicate: false, matchedAlert: null };
    }

    // Use AI to determine if this is a duplicate
    const prompt = `Analyze if this new fire alert is a duplicate of existing alerts:

NEW ALERT:
- Headline: ${newAlert.headline || 'N/A'}
- Description: ${newAlert.description || 'N/A'}
- Address: ${newAlert.address_text || 'N/A'}
- City: ${newAlert.city || 'N/A'}, State: ${newAlert.state || 'N/A'}
- Coordinates: ${newAlert.lat || 'N/A'}, ${newAlert.lon || 'N/A'}
- Time: ${newAlert.occurred_at || new Date().toISOString()}

EXISTING ALERTS (last 24h):
${recentAlerts.map((a, i) => `
Alert ${i + 1}:
- Headline: ${a.headline || 'N/A'}
- Description: ${a.description || 'N/A'}
- Address: ${a.address_text || 'N/A'}
- City: ${a.city || 'N/A'}, State: ${a.state || 'N/A'}
- Coordinates: ${a.lat || 'N/A'}, ${a.lon || 'N/A'}
- Time: ${a.occurred_at || a.received_at}
`).join('\n')}

Determine if the new alert is reporting the same fire incident as any existing alert. Consider:
- Location proximity (same building/address or very close)
- Time proximity (same timeframe)
- Description similarity (same event being described)
- Different alerts about the same fire are duplicates

Return the index (0-based) of the matching alert if duplicate, or -1 if unique.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          is_duplicate: { type: "boolean" },
          matched_index: { type: "number" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string" }
        },
        required: ["is_duplicate", "matched_index"]
      }
    });

    return {
      isDuplicate: result.is_duplicate,
      matchedAlert: result.matched_index >= 0 ? recentAlerts[result.matched_index] : null,
      confidence: result.confidence,
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('Duplicate detection failed:', error);
    return { isDuplicate: false, matchedAlert: null };
  }
}

/**
 * Generates a concise summary of the alert for list view
 */
export async function generateAlertSummary(alert) {
  try {
    const prompt = `Generate a concise 1-2 sentence summary of this fire alert for quick scanning:

Headline: ${alert.headline || 'N/A'}
Description: ${alert.description || 'N/A'}
Event Type: ${alert.event_type || 'N/A'}
Location: ${alert.address_text || `${alert.city}, ${alert.state}`}

Create a brief, actionable summary that captures:
- What happened (type of fire/incident)
- Key urgency indicators
- Any notable details about damage or response

Keep it under 100 characters if possible. Be direct and clear.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          key_details: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["summary"]
      }
    });

    return {
      summary: result.summary,
      keyDetails: result.key_details || []
    };
  } catch (error) {
    console.error('Summary generation failed:', error);
    return {
      summary: alert.headline || alert.description?.substring(0, 100) || 'Fire alert',
      keyDetails: []
    };
  }
}

/**
 * Clusters duplicate alerts using AI and marks older ones as stale
 */
export async function clusterDuplicateAlerts(alerts) {
  if (!alerts || alerts.length < 2) return { clusters: [], updates: [] };

  try {
    const prompt = `Analyze these fire alerts and cluster duplicates (same incident reported multiple times):

${alerts.map((a, i) => `
Alert ${i}:
- ID: ${a.id}
- Headline: ${a.headline || 'N/A'}
- Description: ${a.description || 'N/A'}
- Address: ${a.address_text || `${a.city}, ${a.state}`}
- Coordinates: ${a.lat || 'N/A'}, ${a.lon || 'N/A'}
- Occurred: ${a.occurred_at || 'N/A'}
- Received: ${a.received_at}
- Status: ${a.status}
- Source: ${a.source}
`).join('\n')}

Group alerts that describe the same fire incident. Consider:
- Location proximity (same address or within ~100m)
- Time proximity (within same day)
- Description similarity (same event)
- Newer alerts may have more details than older ones

For each cluster:
- Identify the most detailed/recent alert as primary
- Mark older/less detailed alerts as stale
- Suggest merged details from all alerts

Return clusters where each cluster has alert IDs and the primary alert ID.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          clusters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                cluster_id: { type: "string" },
                primary_alert_index: { type: "number" },
                alert_indices: { 
                  type: "array",
                  items: { type: "number" }
                },
                merged_description: { type: "string" },
                reasoning: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Build clusters with actual alert IDs
    const clusters = result.clusters.map(cluster => ({
      cluster_id: cluster.cluster_id,
      primary_alert_id: alerts[cluster.primary_alert_index]?.id,
      alert_ids: cluster.alert_indices.map(idx => alerts[idx]?.id).filter(Boolean),
      merged_description: cluster.merged_description,
      reasoning: cluster.reasoning
    }));

    // Generate updates to mark stale alerts
    const updates = [];
    for (const cluster of clusters) {
      for (const alertId of cluster.alert_ids) {
        if (alertId !== cluster.primary_alert_id) {
          updates.push({
            id: alertId,
            data: {
              status: 'Stale',
              cluster_id: cluster.cluster_id,
              primary_alert_id: cluster.primary_alert_id
            }
          });
        } else {
          updates.push({
            id: alertId,
            data: {
              cluster_id: cluster.cluster_id,
              description: cluster.merged_description || alerts.find(a => a.id === alertId)?.description
            }
          });
        }
      }
    }

    return { clusters, updates };
  } catch (error) {
    console.error('Alert clustering failed:', error);
    return { clusters: [], updates: [] };
  }
}

/**
 * Enhances an alert with AI-powered analysis
 */
export async function enhanceFireAlert(alertData, existingAlerts = []) {
  const enhanced = { ...alertData };

  // 1. Always analyze with AI for consistent quality
  const analysis = await analyzeAlertSeverity(
    enhanced.headline,
    enhanced.description,
    enhanced.event_type
  );
  
  // Store original source data
  if (!enhanced.raw) enhanced.raw = {};
  enhanced.raw.source_severity = enhanced.severity;
  enhanced.raw.source_confidence = enhanced.confidence;
  enhanced.raw.ai_analysis = analysis.reasoning;
  enhanced.raw.ai_severity = analysis.severity;
  enhanced.raw.ai_confidence = analysis.confidence;
  
  // Decision logic: Use AI scores if source is missing or low confidence
  const sourceConfidence = enhanced.confidence || 0;
  const shouldOverride = !enhanced.severity || 
                         !enhanced.confidence || 
                         sourceConfidence < 0.5 || 
                         analysis.confidence > sourceConfidence + 0.2;
  
  if (shouldOverride) {
    enhanced.severity = analysis.severity;
    enhanced.confidence = analysis.confidence;
    enhanced.raw.used_ai_override = true;
  } else {
    enhanced.raw.used_ai_override = false;
  }

  // 2. Geocode address if coordinates missing or low quality
  const shouldGeocode = (!enhanced.lat || !enhanced.lon) && (enhanced.address_text || enhanced.city);
  
  if (shouldGeocode) {
    const geocoded = await geocodeAddress(
      enhanced.address_text,
      enhanced.city,
      enhanced.state,
      enhanced.zip
    );
    
    if (geocoded.lat && geocoded.lon) {
      // Store original coordinates if they existed
      if (enhanced.lat || enhanced.lon) {
        if (!enhanced.raw) enhanced.raw = {};
        enhanced.raw.original_lat = enhanced.lat;
        enhanced.raw.original_lon = enhanced.lon;
      }
      
      enhanced.lat = geocoded.lat;
      enhanced.lon = geocoded.lon;
      
      // Use formatted address if better than original
      if (geocoded.formatted_address) {
        if (!enhanced.address_text || geocoded.confidence > 0.7) {
          enhanced.address_text = geocoded.formatted_address;
        }
      }
      
      // Store geocoding metadata
      if (!enhanced.raw) enhanced.raw = {};
      enhanced.raw.geocoding = {
        method: geocoded.method,
        confidence: geocoded.confidence,
        precision_level: geocoded.precision_level,
        formatted_address: geocoded.formatted_address,
        notes: geocoded.notes
      };
    } else {
      // Store failure reason
      if (!enhanced.raw) enhanced.raw = {};
      enhanced.raw.geocoding = {
        method: geocoded.method,
        error: geocoded.error || 'Failed to geocode',
        attempted_address: [enhanced.address_text, enhanced.city, enhanced.state, enhanced.zip].filter(Boolean).join(', ')
      };
    }
  }

  // 3. Check for duplicates
  const dupeCheck = await findDuplicateAlerts(enhanced, existingAlerts);
  if (dupeCheck.isDuplicate && dupeCheck.matchedAlert) {
    // Store duplicate info but don't prevent creation
    if (!enhanced.raw) enhanced.raw = {};
    enhanced.raw.duplicate_check = {
      is_duplicate: true,
      matched_alert_id: dupeCheck.matchedAlert.id,
      confidence: dupeCheck.confidence,
      reasoning: dupeCheck.reasoning
    };
  }

  return enhanced;
}