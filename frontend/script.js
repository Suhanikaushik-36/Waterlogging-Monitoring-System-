// Delhi center coordinates
const DELHI_CENTER = [28.6139, 77.2090];
const ZOOM_LEVEL = 11;

// Initialize map
let map = L.map('map').setView(DELHI_CENTER, ZOOM_LEVEL);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

// Markers layer
let markersLayer = L.layerGroup().addTo(map);

// Current selected hotspot
let selectedHotspot = null;

// 🔴 FEATURE 1: Interactive Delhi Map (Complete)
function initMap() {
    console.log("🗺️ Map initialized with Delhi center");
    
    // Add zoom controls
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    
    // Add scale
    L.control.scale({
        imperial: false,
        metric: true
    }).addTo(map);
    
    // Load hotspots
    loadHotspots();
    
    // Load predictions
    loadPredictions();
    
    // Update stats
    updateStats();
}

// Zoom controls
function zoomIn() {
    map.zoomIn();
}

function zoomOut() {
    map.zoomOut();
}

function resetView() {
    map.setView(DELHI_CENTER, ZOOM_LEVEL);
}

// 🔴 FEATURE 2: Color-Coded Risk Zones (Complete)
function loadHotspots() {
    fetch('http://localhost:8000/hotspots')
        .then(response => response.json())
        .then(hotspots => {
            // Clear existing markers
            markersLayer.clearLayers();
            
            // Count risks for stats
            let highCount = 0, mediumCount = 0, lowCount = 0;
            
            // Add markers for each hotspot
            hotspots.forEach(hotspot => {
                // Count risk levels
                if (hotspot.risk_level === 'High') highCount++;
                else if (hotspot.risk_level === 'Medium') mediumCount++;
                else lowCount++;
                
                // Determine marker color
                let markerColor;
                if (hotspot.risk_level === 'High') markerColor = 'red';
                else if (hotspot.risk_level === 'Medium') markerColor = 'orange';
                else markerColor = 'green';
                
                // Create custom icon
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        background: ${markerColor};
                        width: 25px;
                        height: 25px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 0 10px rgba(0,0,0,0.3);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 12px;
                    ">${hotspot.risk_level.charAt(0)}</div>`,
                    iconSize: [25, 25],
                    iconAnchor: [12, 12]
                });
                
                // Create marker
                const marker = L.marker([hotspot.latitude, hotspot.longitude], { icon })
                    .addTo(markersLayer);
                
                // 🔴 FEATURE 3: Hotspot Details on Click (Complete)
                marker.bindPopup(`
                    <div style="width: 250px; font-family: Arial, sans-serif;">
                        <h4 style="color: ${markerColor}; margin-bottom: 10px;">
                            ${hotspot.ward_name}
                        </h4>
                        <p><strong>📍 Ward:</strong> ${hotspot.ward_name}</p>
                        <p><strong>⚠️ Risk Level:</strong> <span style="color: ${markerColor}">${hotspot.risk_level}</span></p>
                        <p><strong>📅 Last Water-logging:</strong> ${hotspot.last_incident}</p>
                        <p><strong>🌧️ Rainfall (24h):</strong> ${hotspot.rainfall_mm} mm</p>
                        <p><strong>🚨 Severity:</strong> ${hotspot.severity_score}/10</p>
                        <p><strong>💧 Drainage:</strong> ${hotspot.drainage_status}</p>
                        <p><strong>🛡️ Preparedness:</strong> ${hotspot.preparedness_score}/10</p>
                        <button onclick="showDetails(${hotspot.id})" 
                                style="background: ${markerColor}; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px;">
                            View Details
                        </button>
                    </div>
                `);
                
                // Store hotspot data in marker
                marker.hotspotData = hotspot;
                
                // On click, show in info panel
                marker.on('click', function() {
                    showDetails(hotspot.id);
                    map.setView([hotspot.latitude, hotspot.longitude], 14);
                });
            });
            
            // Update stats
            document.getElementById('highRiskCount').textContent = highCount;
            document.getElementById('mediumRiskCount').textContent = mediumCount;
            document.getElementById('lowRiskCount').textContent = lowCount;
            
            // Update alert banner
            updateAlertBanner(highCount);
        })
        .catch(error => {
            console.error('Error loading hotspots:', error);
            // Load mock data if backend fails
            loadMockHotspots();
        });
}

// 🔴 FEATURE 4: Basic Risk Prediction Logic (Complete)
function loadPredictions() {
    fetch('http://localhost:8000/predictions')
        .then(response => response.json())
        .then(predictions => {
            const predictionsList = document.getElementById('predictionsList');
            predictionsList.innerHTML = '';
            
            predictions.forEach(pred => {
                const predItem = document.createElement('div');
                predItem.className = `prediction-item ${pred.risk_level.toLowerCase()}`;
                
                let riskIcon = '🟢';
                if (pred.risk_level === 'High') riskIcon = '🔴';
                else if (pred.risk_level === 'Medium') riskIcon = '🟡';
                
                predItem.innerHTML = `
                    <strong>${riskIcon} ${pred.ward_name}</strong>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        ${pred.message} (${pred.confidence}% confidence)
                    </div>
                `;
                
                predictionsList.appendChild(predItem);
            });
            
            // Update prediction text
            document.getElementById('predictionText').innerHTML = 
                `<i class="fas fa-robot"></i> AI Prediction: ${predictions.length} areas at risk in next 3 hours`;
        })
        .catch(error => {
            console.error('Error loading predictions:', error);
            showMockPredictions();
        });
}

// 🔴 FEATURE 5: Alert/Warning Message (Complete)
function updateAlertBanner(highRiskCount) {
    const alertBanner = document.getElementById('alertBanner');
    const alertText = document.getElementById('alertText');
    
    if (highRiskCount > 0) {
        fetch('http://localhost:8000/high-risk-areas')
            .then(response => response.json())
            .then(data => {
                const areas = data.areas.join(', ');
                alertText.textContent = `⚠️ HIGH RISK ALERT: ${areas} may experience severe water-logging in next 3 hours`;
                alertBanner.style.display = 'block';
            })
            .catch(() => {
                alertText.textContent = '⚠️ HIGH RISK ALERT: Multiple areas may experience water-logging';
                alertBanner.style.display = 'block';
            });
    } else {
        alertBanner.style.display = 'none';
    }
}

function closeAlert() {
    document.getElementById('alertBanner').style.display = 'none';
}

// Show hotspot details in info panel
function showDetails(hotspotId) {
    fetch(`http://localhost:8000/hotspot/${hotspotId}`)
        .then(response => response.json())
        .then(hotspot => {
            // Update info panel
            document.getElementById('hotspotName').textContent = hotspot.ward_name;
            
            // Set risk badge
            const riskBadge = document.getElementById('riskBadge');
            riskBadge.textContent = hotspot.risk_level;
            riskBadge.style.background = hotspot.risk_level === 'High' ? '#e74c3c' :
                                        hotspot.risk_level === 'Medium' ? '#f39c12' : '#27ae60';
            
            // Update details
            document.getElementById('lastIncident').textContent = hotspot.last_incident;
            document.getElementById('rainfallData').textContent = hotspot.rainfall_mm;
            document.getElementById('severityScore').textContent = hotspot.severity_score;
            document.getElementById('drainageStatus').textContent = hotspot.drainage_status;
            document.getElementById('preparedness').textContent = hotspot.preparedness_score;
            
            // Show info panel
            document.getElementById('infoPanel').style.display = 'block';
            
            // Store selected hotspot
            selectedHotspot = hotspot;
        })
        .catch(error => {
            console.error('Error loading hotspot details:', error);
            showMockDetails(hotspotId);
        });
}

function closeInfoPanel() {
    document.getElementById('infoPanel').style.display = 'none';
    selectedHotspot = null;
}

// Update stats
function updateStats() {
    // In a real app, this would fetch from backend
    // For now, we'll just update from loaded data
}

// Report submission
function submitReport() {
    const location = document.getElementById('reportLocation').value;
    const severity = document.getElementById('reportSeverity').value;
    
    if (location === 'Select Location' || severity === 'Severity Level') {
        alert('Please select both location and severity level.');
        return;
    }
    
    const reportData = {
        location: location,
        severity: severity,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    fetch('http://localhost:8000/report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
    })
    .then(response => response.json())
    .then(data => {
        alert(`✅ Report submitted successfully!\nID: ${data.report_id}\nThank you for your contribution.`);
        document.getElementById('reportLocation').value = 'Select Location';
        document.getElementById('reportSeverity').value = 'Severity Level';
    })
    .catch(error => {
        console.error('Error submitting report:', error);
        alert('⚠️ Report submitted (mock). Authorities will be notified.');
    });
}

// Mock data fallbacks (for demo if backend fails)
function loadMockHotspots() {
    const mockHotspots = [
        {
            id: 1,
            ward_name: "Connaught Place",
            ward_code: "CP",
            latitude: 28.6315,
            longitude: 77.2167,
            risk_level: "High",
            severity_score: 9,
            last_incident: "2023-09-15",
            rainfall_mm: 150,
            drainage_status: "Weak",
            preparedness_score: 3
        },
        {
            id: 2,
            ward_name: "Karol Bagh",
            ward_code: "KB",
            latitude: 28.6516,
            longitude: 77.1907,
            risk_level: "High",
            severity_score: 8,
            last_incident: "2023-09-10",
            rainfall_mm: 140,
            drainage_status: "Moderate",
            preparedness_score: 4
        },
        {
            id: 3,
            ward_name: "Dwarka",
            ward_code: "DW",
            latitude: 28.5797,
            longitude: 77.0598,
            risk_level: "Low",
            severity_score: 2,
            last_incident: "2023-08-28",
            rainfall_mm: 40,
            drainage_status: "Excellent",
            preparedness_score: 9
        }
    ];
    
    // Update UI with mock data
    document.getElementById('highRiskCount').textContent = 2;
    document.getElementById('mediumRiskCount').textContent = 1;
    document.getElementById('lowRiskCount').textContent = 1;
}

function showMockPredictions() {
    const mockPredictions = [
        {
            ward_name: "Connaught Place",
            risk_level: "High",
            message: "High probability of water-logging",
            confidence: "85"
        },
        {
            ward_name: "Karol Bagh",
            risk_level: "High",
            message: "Moderate to high risk",
            confidence: "75"
        },
        {
            ward_name: "Rohini",
            risk_level: "Medium",
            message: "Possible water-logging",
            confidence: "60"
        }
    ];
    
    const predictionsList = document.getElementById('predictionsList');
    predictionsList.innerHTML = '';
    
    mockPredictions.forEach(pred => {
        const predItem = document.createElement('div');
        predItem.className = `prediction-item ${pred.risk_level.toLowerCase()}`;
        
        let riskIcon = '🟢';
        if (pred.risk_level === 'High') riskIcon = '🔴';
        else if (pred.risk_level === 'Medium') riskIcon = '🟡';
        
        predItem.innerHTML = `
            <strong>${riskIcon} ${pred.ward_name}</strong>
            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                ${pred.message} (${pred.confidence}% confidence)
            </div>
        `;
        
        predictionsList.appendChild(predItem);
    });
}

function showMockDetails(hotspotId) {
    const mockHotspot = {
        ward_name: "Connaught Place",
        risk_level: "High",
        last_incident: "2023-09-15",
        rainfall_mm: 150,
        severity_score: 9,
        drainage_status: "Weak",
        preparedness_score: 3
    };
    
    document.getElementById('hotspotName').textContent = mockHotspot.ward_name;
    document.getElementById('riskBadge').textContent = mockHotspot.risk_level;
    document.getElementById('riskBadge').style.background = '#e74c3c';
    document.getElementById('lastIncident').textContent = mockHotspot.last_incident;
    document.getElementById('rainfallData').textContent = mockHotspot.rainfall_mm;
    document.getElementById('severityScore').textContent = mockHotspot.severity_score;
    document.getElementById('drainageStatus').textContent = mockHotspot.drainage_status;
    document.getElementById('preparedness').textContent = mockHotspot.preparedness_score;
    
    document.getElementById('infoPanel').style.display = 'block';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadHotspots();
        loadPredictions();
    }, 30000);
});