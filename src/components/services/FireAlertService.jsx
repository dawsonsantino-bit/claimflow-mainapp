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
 * Geocodes an address to lat/lon coordinates
 */
export async function geocodeAddress(addressText, city, state, zip) {
  try {
    const fullAddress = [addressText, city, state, zip].filter(Boolean).join(', ');
    
    const prompt = `Geocode this address and return the latitude and longitude coordinates:

Address: ${fullAddress}

Return the most accurate coordinates for this location. If the address is invalid or cannot be found, return null for both lat and lon.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          lat: { type: "number" },
          lon: { type: "number" },
          formatted_address: { type: "string" }
        }
      }
    });

    return {
      lat: result.lat,
      lon: result.lon,
      formatted_address: result.formatted_address
    };
  } catch (error) {
    console.error('Geocoding failed:', error);
    return { lat: null, lon: null, formatted_address: null };
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
 * Enhances an alert with AI-powered analysis
 */
export async function enhanceFireAlert(alertData, existingAlerts = []) {
  const enhanced = { ...alertData };

  // 1. Analyze severity and confidence if not provided
  if (!enhanced.severity || !enhanced.confidence) {
    const analysis = await analyzeAlertSeverity(
      enhanced.headline,
      enhanced.description,
      enhanced.event_type
    );
    
    if (!enhanced.severity) enhanced.severity = analysis.severity;
    if (!enhanced.confidence) enhanced.confidence = analysis.confidence;
    
    // Store reasoning in raw data
    if (!enhanced.raw) enhanced.raw = {};
    enhanced.raw.ai_analysis = analysis.reasoning;
  }

  // 2. Geocode address if coordinates missing
  if ((!enhanced.lat || !enhanced.lon) && (enhanced.address_text || enhanced.city)) {
    const geocoded = await geocodeAddress(
      enhanced.address_text,
      enhanced.city,
      enhanced.state,
      enhanced.zip
    );
    
    if (geocoded.lat && geocoded.lon) {
      enhanced.lat = geocoded.lat;
      enhanced.lon = geocoded.lon;
      if (geocoded.formatted_address && !enhanced.address_text) {
        enhanced.address_text = geocoded.formatted_address;
      }
      
      // Store in raw data
      if (!enhanced.raw) enhanced.raw = {};
      enhanced.raw.geocoded = true;
      enhanced.raw.geocoded_address = geocoded.formatted_address;
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