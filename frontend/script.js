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

// User reports storage
let userReports = JSON.parse(localStorage.getItem('delhi_user_reports') || '[]');

// Inbuilt Delhi hotspots
const INBUILT_HOTSPOTS = [
    {
        id: 101,
        ward_name: "Connaught Place",
        latitude: 28.6315,
        longitude: 77.2167,
        risk_level: "High",
        severity_score: 9,
        last_incident: "2024-01-10",
        rainfall_mm: 45,
        drainage_status: "Weak",
        preparedness_score: 3
    },
    {
        id: 102,
        ward_name: "Karol Bagh",
        latitude: 28.6516,
        longitude: 77.1907,
        risk_level: "High",
        severity_score: 8,
        last_incident: "2024-01-05",
        rainfall_mm: 38,
        drainage_status: "Moderate",
        preparedness_score: 4
    },
    {
        id: 103,
        ward_name: "Rohini",
        latitude: 28.7433,
        longitude: 77.0675,
        risk_level: "Medium",
        severity_score: 5,
        last_incident: "2024-01-02",
        rainfall_mm: 25,
        drainage_status: "Good",
        preparedness_score: 7
    },
    {
        id: 104,
        ward_name: "Dwarka",
        latitude: 28.5797,
        longitude: 77.0598,
        risk_level: "Low",
        severity_score: 2,
        last_incident: "2023-12-28",
        rainfall_mm: 15,
        drainage_status: "Excellent",
        preparedness_score: 9
    },
    {
        id: 105,
        ward_name: "Laxmi Nagar",
        latitude: 28.6285,
        longitude: 77.2759,
        risk_level: "High",
        severity_score: 7,
        last_incident: "2024-01-08",
        rainfall_mm: 42,
        drainage_status: "Weak",
        preparedness_score: 4
    }
];

// INIT MAP
function initMap() {
    loadAllHotspots();
    updateCounters();
    updateAIPredictions();
}

// Load all hotspots
function loadAllHotspots() {
    markersLayer.clearLayers();
    displayHotspots(INBUILT_HOTSPOTS, 'inbuilt');
    displayUserReports();
}

// Display hotspots
function displayHotspots(hotspots, source) {
    hotspots.forEach(h => {
        let color = h.risk_level === "High" ? "red" :
                    h.risk_level === "Medium" ? "orange" : "green";
        let markerChar = source === "user" ? "📍" : h.risk_level[0];

        if (source === "user") color = "#9b59b6";

        const icon = L.divIcon({
            html: `<div style="
                background:${color};
                width:30px;
                height:30px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                color:white;
                font-weight:bold;
                border:3px solid white;
                cursor:pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">${markerChar}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            className: 'hotspot-marker'
        });

        const marker = L.marker([h.latitude, h.longitude], { icon }).addTo(markersLayer);

        // Create dropdown/popup content
        const popupContent = `
            <div class="marker-popup">
                <h4>${h.ward_name}</h4>
                <div class="popup-details">
                    <div class="detail-row">
                        <span class="label">Risk Level:</span>
                        <span class="value risk-${h.risk_level.toLowerCase()}">${h.risk_level}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Severity:</span>
                        <span class="value">${h.severity_score}/10</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Last Water Logging:</span>
                        <span class="value">${h.last_incident}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Drainage:</span>
                        <span class="value">${h.drainage_status}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Preparedness:</span>
                        <span class="value">${h.preparedness_score}/10</span>
                    </div>
                    <button onclick="showDetailsPanel(${source === 'user' ? 'null' : h.id}, '${h.ward_name}', '${h.risk_level}', ${h.severity_score}, '${h.last_incident}', '${h.drainage_status}', ${h.preparedness_score})" 
                            class="view-details-btn">
                        View Full Details
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, {
            maxWidth: 300,
            minWidth: 250,
            className: 'custom-popup'
        });

        // Add click handler for details panel
        marker.on('click', function(e) {
            map.setView([h.latitude, h.longitude], 14);
            if (source === 'inbuilt') {
                showDetailsPanel(h.id, h.ward_name, h.risk_level, h.severity_score, 
                               h.last_incident, h.drainage_status, h.preparedness_score);
            } else {
                showDetailsPanel(null, h.ward_name, h.risk_level, h.severity_score, 
                               h.last_incident, "Unknown", "-");
            }
        });
    });
}

// Show details panel with fixed icon
function showDetailsPanel(id, name, riskLevel, severity, lastIncident, drainage, preparedness) {
    const iconMap = {
        'High': '🔴',
        'Medium': '🟠', 
        'Low': '🟢'
    };
    
    const icon = iconMap[riskLevel] || '📍';
    
    document.getElementById('hotspotName').innerHTML = `
        <span style="font-size: 20px; margin-right: 10px;">${icon}</span>
        ${name}
    `;
    document.getElementById('riskBadge').textContent = riskLevel;
    document.getElementById('riskBadge').className = `risk-badge risk-${riskLevel.toLowerCase()}`;
    document.getElementById('lastIncident').textContent = lastIncident;
    document.getElementById('rainfallData').textContent = id ? INBUILT_HOTSPOTS.find(h => h.id === id)?.rainfall_mm || '-' : '-';
    document.getElementById('severityScore').textContent = severity;
    document.getElementById('drainageStatus').textContent = drainage;
    document.getElementById('preparedness').textContent = preparedness;

    document.getElementById('infoPanel').style.display = 'block';
    document.getElementById('infoPanel').scrollIntoView({ behavior: 'smooth' });
}

// Display user reports
function displayUserReports() {
    const userHotspots = userReports.map(r => ({
        id: r.id,
        ward_name: r.location,
        latitude: r.lat,
        longitude: r.lon,
        risk_level: r.severity,
        severity_score: r.severity === "High" ? 8 : r.severity === "Medium" ? 5 : 3,
        last_incident: r.timestamp.split('T')[0],
        rainfall_mm: "-",
        drainage_status: "Unknown",
        preparedness_score: "-"
    }));

    displayHotspots(userHotspots, 'user');
}

// Update AI Predictions column
function updateAIPredictions() {
    const predictionsContainer = document.querySelector('.ai-predictions-list');
    if (!predictionsContainer) return;

    // Clear previous predictions
    predictionsContainer.innerHTML = '';
    
    // Combine inbuilt and user hotspots
    const allHotspots = [
        ...INBUILT_HOTSPOTS.map(h => ({
            ...h,
            type: 'inbuilt'
        })),
        ...userReports.map(r => ({
            id: r.id,
            ward_name: r.location,
            latitude: r.lat,
            longitude: r.lon,
            risk_level: r.severity,
            severity_score: r.severity === "High" ? 8 : r.severity === "Medium" ? 5 : 3,
            last_incident: r.timestamp.split('T')[0],
            rainfall_mm: "-",
            drainage_status: "Unknown",
            preparedness_score: "-",
            type: 'user'
        }))
    ];

    // Calculate severity percentage based on various factors
    allHotspots.forEach(hotspot => {
        let severityPercent;
        
        if (hotspot.type === 'inbuilt') {
            // For inbuilt hotspots, use a combination of factors
            const rainfallFactor = Math.min(hotspot.rainfall_mm / 50 * 100, 100);
            const drainageFactor = {
                'Excellent': 20,
                'Good': 40,
                'Moderate': 60,
                'Weak': 80
            }[hotspot.drainage_status] || 50;
            
            severityPercent = Math.round((rainfallFactor * 0.6) + (drainageFactor * 0.4));
        } else {
            // For user reports, base on severity level
            severityPercent = hotspot.risk_level === "High" ? 85 : 
                            hotspot.risk_level === "Medium" ? 60 : 35;
        }

        // Add randomness for AI prediction feel
        severityPercent += Math.random() * 10 - 5;
        severityPercent = Math.max(5, Math.min(100, Math.round(severityPercent)));

        const predictionItem = document.createElement('div');
        predictionItem.className = 'prediction-item';
        predictionItem.innerHTML = `
            <div class="prediction-header">
                <span class="prediction-location">${hotspot.ward_name}</span>
                <span class="prediction-percent ${severityPercent > 70 ? 'high-risk' : severityPercent > 40 ? 'medium-risk' : 'low-risk'}">
                    ${severityPercent}%
                </span>
            </div>
            <div class="prediction-details">
                <small>Risk: ${hotspot.risk_level} | Last: ${hotspot.last_incident}</small>
            </div>
            <div class="prediction-bar">
                <div class="prediction-fill" style="width: ${severityPercent}%"></div>
            </div>
        `;
        
        // Add click handler to zoom to location
        predictionItem.style.cursor = 'pointer';
        predictionItem.onclick = () => {
            map.setView([hotspot.latitude, hotspot.longitude], 14);
            showDetailsPanel(
                hotspot.type === 'inbuilt' ? hotspot.id : null,
                hotspot.ward_name,
                hotspot.risk_level,
                hotspot.severity_score,
                hotspot.last_incident,
                hotspot.drainage_status,
                hotspot.preparedness_score
            );
        };
        
        predictionsContainer.appendChild(predictionItem);
    });
}

// Update counters
function updateCounters() {
    let high = 0, medium = 0, low = 0;

    INBUILT_HOTSPOTS.forEach(h => {
        if (h.risk_level === "High") high++;
        else if (h.risk_level === "Medium") medium++;
        else low++;
    });

    userReports.forEach(r => {
        if (r.severity === "High") high++;
        else if (r.severity === "Medium") medium++;
        else low++;
    });

    document.getElementById('highRiskCount').textContent = high;
    document.getElementById('mediumRiskCount').textContent = medium;
    document.getElementById('lowRiskCount').textContent = low;
}

// Submit report
function submitReport() {
    const location = document.getElementById('reportLocation').value.trim();
    const severity = document.getElementById('reportSeverity').value;

    if (!location || severity === 'Select Severity') {
        alert("Please enter location and select severity");
        return;
    }

    const report = {
        id: Date.now(),
        location,
        severity,
        lat: 28.6139 + (Math.random() * 0.15 - 0.075),
        lon: 77.2090 + (Math.random() * 0.15 - 0.075),
        timestamp: new Date().toISOString()
    };

    userReports.push(report);
    localStorage.setItem('delhi_user_reports', JSON.stringify(userReports));

    document.getElementById('reportLocation').value = '';
    document.getElementById('reportSeverity').value = 'Select Severity';

    loadAllHotspots();
    updateCounters();
    updateAIPredictions();

    map.setView([report.lat, report.lon], 14);
    
    // Show notification
    alert(`Report submitted successfully for ${location}!`);
}

// Refresh AI Predictions (called from button)
function refreshPredictions() {
    // Simulate refreshing predictions
    document.querySelector('.rainfall-current').textContent = '45 mm';
    document.querySelector('.rainfall-forecast').textContent = '60 mm';
    
    // Recalculate predictions
    updateAIPredictions();
    
    alert('AI predictions refreshed with latest rainfall data!');
}

// Close info panel
function closeInfoPanel() {
    document.getElementById('infoPanel').style.display = 'none';
}

// Add CSS styles for the new features
const style = document.createElement('style');
style.textContent = `
    .custom-popup .leaflet-popup-content-wrapper {
        border-radius: 10px;
        padding: 5px;
    }
    
    .marker-popup {
        padding: 5px;
    }
    
    .marker-popup h4 {
        margin: 0 0 10px 0;
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 5px;
    }
    
    .popup-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .detail-row .label {
        font-weight: 600;
        color: #34495e;
        font-size: 12px;
    }
    
    .detail-row .value {
        font-weight: 500;
        color: #2c3e50;
        font-size: 13px;
    }
    
    .view-details-btn {
        margin-top: 10px;
        background: #3498db;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        width: 100%;
        transition: background 0.3s;
    }
    
    .view-details-btn:hover {
        background: #2980b9;
    }
    
    /* AI Predictions Styling */
    .ai-predictions-list {
        max-height: 400px;
        overflow-y: auto;
        margin-top: 15px;
    }
    
    .prediction-item {
        background: white;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .prediction-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .prediction-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
    }
    
    .prediction-location {
        font-weight: 600;
        color: #2c3e50;
        font-size: 14px;
    }
    
    .prediction-percent {
        font-weight: bold;
        font-size: 16px;
        padding: 2px 8px;
        border-radius: 12px;
    }
    
    .prediction-percent.high-risk {
        color: #e74c3c;
        background: rgba(231, 76, 60, 0.1);
    }
    
    .prediction-percent.medium-risk {
        color: #f39c12;
        background: rgba(243, 156, 18, 0.1);
    }
    
    .prediction-percent.low-risk {
        color: #27ae60;
        background: rgba(39, 174, 96, 0.1);
    }
    
    .prediction-details small {
        color: #7f8c8d;
        font-size: 11px;
    }
    
    .prediction-bar {
        height: 6px;
        background: #ecf0f1;
        border-radius: 3px;
        margin-top: 8px;
        overflow: hidden;
    }
    
    .prediction-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.5s ease;
    }
    
    /* Risk Badges */
    .risk-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        color: white;
    }
    
    .risk-high {
        background: #e74c3c;
    }
    
    .risk-medium {
        background: #f39c12;
    }
    
    .risk-low {
        background: #27ae60;
    }
    
    /* Info Panel Styling */
    #infoPanel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        padding: 15px;
    }
    
    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #7f8c8d;
    }
    
    .hotspot-icon {
        font-size: 24px;
        margin-right: 10px;
    }
`;

document.head.appendChild(style);

// Init
document.addEventListener('DOMContentLoaded', initMap);
// Add this function to properly update AI predictions
function updateAIPredictions() {
    const predictionsContainer = document.getElementById('aiPredictionsList');
    if (!predictionsContainer) {
        console.error("AI predictions container not found!");
        return;
    }

    // Clear previous predictions
    predictionsContainer.innerHTML = '';
    
    // Combine inbuilt and user hotspots
    const allHotspots = [
        ...INBUILT_HOTSPOTS.map(h => ({
            ...h,
            type: 'inbuilt'
        })),
        ...userReports.map(r => ({
            id: r.id,
            ward_name: r.location,
            latitude: r.lat,
            longitude: r.lon,
            risk_level: r.severity,
            severity_score: r.severity === "High" ? 8 : r.severity === "Medium" ? 5 : 3,
            last_incident: r.timestamp.split('T')[0],
            rainfall_mm: 45, // Use current rainfall data
            drainage_status: "Unknown",
            preparedness_score: "-",
            type: 'user'
        }))
    ];

    // If no hotspots, show message
    if (allHotspots.length === 0) {
        predictionsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No locations available. Add a report or wait for data.</p>';
        return;
    }

    // Sort by severity (highest first)
    allHotspots.sort((a, b) => {
        const scoreA = a.severity_score || 0;
        const scoreB = b.severity_score || 0;
        return scoreB - scoreA;
    });

    // Create prediction items for each hotspot
    allHotspots.forEach(hotspot => {
        // Calculate AI severity percentage
        let severityPercent = calculateSeverityPercentage(hotspot);
        
        // Create the prediction item
        const predictionItem = document.createElement('div');
        predictionItem.className = 'prediction-item';
        
        // Determine color class for percentage
        let riskClass = 'medium-risk';
        if (severityPercent >= 70) riskClass = 'high-risk';
        else if (severityPercent <= 40) riskClass = 'low-risk';
        
        // Set fill color based on severity
        let fillColor = '#f39c12'; // orange for medium
        if (severityPercent >= 70) fillColor = '#e74c3c'; // red for high
        else if (severityPercent <= 40) fillColor = '#27ae60'; // green for low
        
        predictionItem.innerHTML = `
            <div class="prediction-header">
                <span class="prediction-location">${hotspot.ward_name}</span>
                <span class="prediction-percent ${riskClass}">
                    ${severityPercent}%
                </span>
            </div>
            <div class="prediction-details">
                <small>Risk: ${hotspot.risk_level} | Last incident: ${hotspot.last_incident}</small>
            </div>
            <div class="prediction-bar">
                <div class="prediction-fill" style="width: ${severityPercent}%; background: ${fillColor}"></div>
            </div>
        `;
        
        // Add click handler to zoom to location
        predictionItem.style.cursor = 'pointer';
        predictionItem.onclick = () => {
            map.setView([hotspot.latitude, hotspot.longitude], 14);
            showDetailsPanel(
                hotspot.type === 'inbuilt' ? hotspot.id : null,
                hotspot.ward_name,
                hotspot.risk_level,
                hotspot.severity_score,
                hotspot.last_incident,
                hotspot.drainage_status,
                hotspot.preparedness_score
            );
        };
        
        predictionsContainer.appendChild(predictionItem);
    });
}

// Helper function to calculate severity percentage
function calculateSeverityPercentage(hotspot) {
    let baseScore = 50; // Start at 50%
    
    // Adjust based on risk level
    if (hotspot.risk_level === "High") baseScore += 25;
    else if (hotspot.risk_level === "Medium") baseScore += 10;
    else baseScore -= 15;
    
    // Adjust based on rainfall (using current rainfall of 45mm)
    const currentRainfall = 45; // Get from UI
    if (currentRainfall > 40) baseScore += 15;
    else if (currentRainfall > 20) baseScore += 5;
    
    // Adjust based on drainage
    if (hotspot.drainage_status === "Weak") baseScore += 20;
    else if (hotspot.drainage_status === "Moderate") baseScore += 10;
    else if (hotspot.drainage_status === "Good") baseScore -= 5;
    else if (hotspot.drainage_status === "Excellent") baseScore -= 15;
    
    // Add some randomness for AI prediction feel (±10%)
    baseScore += (Math.random() * 20 - 10);
    
    // Ensure percentage is between 5% and 100%
    return Math.max(5, Math.min(100, Math.round(baseScore)));
}

// Update the refreshPredictions function
function refreshPredictions() {
    // Update rainfall display
    document.querySelector('.rainfall-current').textContent = '45 mm';
    document.querySelector('.rainfall-forecast').textContent = '60 mm';
    
    // Update AI predictions
    updateAIPredictions();
    
    // Show notification
    alert('AI predictions refreshed with latest rainfall data!');
}
// Debug function to test predictions display
function debugPredictions() {
    console.log("Debugging predictions...");
    
    // Check if container exists
    const container = document.getElementById('predictionsList');
    console.log("Predictions container found:", container);
    
    // Check if we have hotspots
    console.log("INBUILT_HOTSPOTS:", INBUILT_HOTSPOTS.length);
    console.log("userReports:", userReports.length);
    
    // Try to manually add a test item
    if (container) {
        container.innerHTML = `
            <div class="prediction-item">
                <div class="prediction-main">
                    <div class="prediction-header">
                        <div class="prediction-location">
                            <i class="fas fa-map-marker-alt"></i>
                            Test Location
                        </div>
                        <div class="prediction-percent high">
                            85%
                        </div>
                    </div>
                    <div class="prediction-details">
                        <small>
                            <i class="fas fa-exclamation-triangle"></i> High Risk
                            <span class="separator">•</span>
                            <i class="fas fa-history"></i> 2024-01-15
                        </small>
                    </div>
                    <div class="prediction-progress">
                        <div class="progress-bar" style="width: 85%; background: #e74c3c"></div>
                    </div>
                </div>
            </div>
        `;
        console.log("Test prediction added!");
    }
}

// Call this in initMap to test
function initMap() {
    console.log("Initializing map...");
    loadAllHotspots();
    updateCounters();
    
    // First try debug
    debugPredictions();
    
    // Then try actual predictions
    setTimeout(() => {
        loadPredictions();
    }, 100);
    
    updateAlertBanner();
}
// Make sure to call updateAIPredictions when initializing
function initMap() {
    loadAllHotspots();
    updateCounters();
    updateAIPredictions(); // Add this line
}

// Also update the submitReport function to refresh AI predictions
function submitReport() {
    const location = document.getElementById('reportLocation').value.trim();
    const severity = document.getElementById('reportSeverity').value;

    if (!location || severity === 'Select Severity') {
        alert("Please enter location and select severity");
        return;
    }

    const report = {
        id: Date.now(),
        location,
        severity,
        lat: 28.6139 + (Math.random() * 0.15 - 0.075),
        lon: 77.2090 + (Math.random() * 0.15 - 0.075),
        timestamp: new Date().toISOString()
    };

    userReports.push(report);
    localStorage.setItem('delhi_user_reports', JSON.stringify(userReports));

    document.getElementById('reportLocation').value = '';
    document.getElementById('reportSeverity').value = 'Select Severity';

    loadAllHotspots();
    updateCounters();
    updateAIPredictions(); // Add this line

    map.setView([report.lat, report.lon], 14);
    
    // Show notification
    alert(`Report submitted successfully for ${location}!`);
}
// Load AI Predictions - SIMPLIFIED VERSION
function loadPredictions() {
    console.log("loadPredictions function called");
    
    const predictionsContainer = document.getElementById('predictionsList');
    if (!predictionsContainer) {
        console.error("ERROR: #predictionsList element not found!");
        // Try to create it if it doesn't exist
        const card = document.querySelector('.prediction-card');
        if (card) {
            const newContainer = document.createElement('div');
            newContainer.id = 'predictionsList';
            newContainer.style.maxHeight = '300px';
            newContainer.style.overflowY = 'auto';
            newContainer.style.margin = '15px 0';
            card.insertBefore(newContainer, document.querySelector('.btn-refresh'));
            console.log("Created predictionsList container");
            return loadPredictions(); // Try again
        }
        return;
    }

    // Clear container
    predictionsContainer.innerHTML = '';
    
    // Show loading message
    predictionsContainer.innerHTML = '<div class="text-center py-3"><i class="fas fa-spinner fa-spin"></i> Loading predictions...</div>';
    
    // Get all hotspots
    const allHotspots = [
        ...INBUILT_HOTSPOTS,
        ...userReports.map(r => ({
            id: r.id,
            ward_name: r.location,
            risk_level: r.severity,
            severity_score: r.severity === "High" ? 8 : r.severity === "Medium" ? 5 : 3,
            last_incident: r.timestamp.split('T')[0],
            drainage_status: "Unknown",
            type: 'user'
        }))
    ];
    
    console.log("Total hotspots found:", allHotspots.length);
    
    // If no hotspots, show message
    if (allHotspots.length === 0) {
        predictionsContainer.innerHTML = '<div class="text-center py-3 text-muted">No hotspots available</div>';
        return;
    }
    
    // Clear and build predictions
    setTimeout(() => {
        predictionsContainer.innerHTML = '';
        
        allHotspots.forEach((hotspot, index) => {
            // Calculate percentage
            let percentage;
            if (hotspot.risk_level === "High") percentage = 70 + Math.floor(Math.random() * 25);
            else if (hotspot.risk_level === "Medium") percentage = 40 + Math.floor(Math.random() * 25);
            else percentage = 10 + Math.floor(Math.random() * 25);
            
            percentage = Math.min(95, Math.max(5, percentage));
            
            // Create prediction item
            const div = document.createElement('div');
            div.className = 'prediction-item mb-2 p-3 border rounded';
            div.style.background = 'white';
            div.style.cursor = 'pointer';
            div.style.transition = 'all 0.2s';
            
            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-map-marker-alt text-primary me-2"></i>
                        <strong>${hotspot.ward_name}</strong>
                    </div>
                    <span class="badge ${hotspot.risk_level === 'High' ? 'bg-danger' : hotspot.risk_level === 'Medium' ? 'bg-warning' : 'bg-success'}">
                        ${percentage}%
                    </span>
                </div>
                <div class="d-flex justify-content-between text-muted small mb-2">
                    <span><i class="fas fa-exclamation-triangle"></i> ${hotspot.risk_level} Risk</span>
                    <span><i class="fas fa-calendar"></i> ${hotspot.last_incident}</span>
                </div>
                <div class="progress" style="height: 5px;">
                    <div class="progress-bar ${hotspot.risk_level === 'High' ? 'bg-danger' : hotspot.risk_level === 'Medium' ? 'bg-warning' : 'bg-success'}" 
                         style="width: ${percentage}%"></div>
                </div>
            `;
            
            // Add click event
            div.onclick = function() {
                alert(`Clicked: ${hotspot.ward_name}\nRisk: ${hotspot.risk_level}\nPrediction: ${percentage}%`);
                // You can add map zoom here if needed
            };
            
            predictionsContainer.appendChild(div);
        });
        
        console.log("Predictions loaded successfully");
    }, 500);
}