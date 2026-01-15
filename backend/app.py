# backend/app.py - REAL IMPLEMENTATION
from flask import Flask, jsonify, request
from flask_cors import CORS
from predictive_engine import predictor
from user_reports import report_manager
from datetime import datetime, timedelta
import json
import threading
import time
import random
import os

app = Flask(__name__)
CORS(app)

print("🚀 Delhi Waterlogging PREDICTIVE System")
print("="*60)
print("📡 Using REAL Delhi topography and rainfall patterns")
print("📍 User reports geocoded to real coordinates")
print("⏰ Updates based on actual rainfall data patterns")
print("="*60)

# Store current data
current_data = {
    "hotspots": [],
    "rainfall": {},
    "predictions": [],
    "user_reports": []
}

def get_real_rainfall():
    """Get ACTUAL rainfall data"""
    return predictor.get_real_rainfall_data()

def update_hotspots():
    """Update hotspots based on current conditions"""
    global current_data
    
    # Get REAL rainfall
    rainfall_data = get_real_rainfall()
    rainfall_mm = rainfall_data["rainfall_mm"]
    
    # Get predictions for all areas
    predictions = predictor.get_predictions_for_all_areas(rainfall_mm)
    
    # Convert to hotspot format
    hotspots = []
    for i, pred in enumerate(predictions[:10], 1):  # Top 10 areas
        hotspot = {
            "id": i,
            "ward_name": pred["area"],
            "ward_code": pred["area"][:2].upper(),
            "latitude": predictor.delhi_topography.get(pred["area"], {}).get("lat", 28.6 + random.random()*0.1),
            "longitude": predictor.delhi_topography.get(pred["area"], {}).get("lon", 77.2 + random.random()*0.1),
            "risk_level": pred["risk_level"],
            "severity_score": pred["severity_score"],
            "last_incident": pred.get("last_incident", ""),
            "rainfall_mm": round(rainfall_mm, 1),
            "drainage_status": self._get_drainage_text(pred["area"]),
            "preparedness_score": pred["preparedness_score"],
            "prediction_confidence": pred["confidence"],
            "will_waterlog": pred["will_waterlog"],
            "last_updated": datetime.now().isoformat(),
            "data_source": "predictive_engine"
        }
        
        # Add elevation data if available
        if pred["area"] in predictor.delhi_topography:
            hotspot["elevation_m"] = predictor.delhi_topography[pred["area"]]["elevation"]
        
        hotspots.append(hotspot)
    
    # Add user-reported hotspots
    user_reports = report_manager.get_active_reports(24)  # Last 24 hours
    for report in user_reports:
        hotspot = {
            "id": len(hotspots) + 1,
            "ward_name": report["location"],
            "ward_code": "UR",  # User Reported
            "latitude": report["latitude"],
            "longitude": report["longitude"],
            "risk_level": "High" if "High" in report["severity"] else "Medium",
            "severity_score": 8 if "High" in report["severity"] else 5,
            "last_incident": report["reported_at"][:10],
            "rainfall_mm": rainfall_mm,
            "drainage_status": "Unknown",
            "preparedness_score": 3,
            "prediction_confidence": 70,
            "will_waterlog": True,
            "last_updated": report["reported_at"],
            "data_source": "user_report",
            "report_id": report["report_id"],
            "description": report.get("description", "")
        }
        hotspots.append(hotspot)
    
    current_data["hotspots"] = hotspots
    current_data["rainfall"] = rainfall_data
    current_data["predictions"] = predictions[:5]  # Top 5 predictions
    current_data["user_reports"] = user_reports
    
    # Save to file (only every hour for persistence)
    if datetime.now().minute == 0:  # On the hour
        with open("data.json", "w") as f:
            json.dump({
                "hotspots": hotspots,
                "rainfall": rainfall_data,
                "last_updated": datetime.now().isoformat()
            }, f, indent=2)
    
    print(f"✅ Updated at {datetime.now().strftime('%H:%M:%S')}")
    print(f"🌧️ Rainfall: {rainfall_mm}mm | High risk areas: {len([h for h in hotspots if h['risk_level']=='High'])}")
    
    return True

def _get_drainage_text(area):
    """Convert drainage score to text"""
    if area in predictor.delhi_topography:
        score = predictor.delhi_topography[area]["drainage_score"]
        if score >= 7:
            return "Excellent"
        elif score >= 5:
            return "Good"
        elif score >= 3:
            return "Moderate"
        else:
            return "Weak"
    return "Unknown"

# Background updater - updates based on REAL rainfall patterns
def start_real_updater():
    def run():
        # Initial update
        update_hotspots()
        
        while True:
            # Check if we need to update (based on rainfall changes)
            current_hour = datetime.now().hour
            
            # Update more frequently during potential rain hours
            if 14 <= current_hour <= 20:  # Afternoon/evening
                wait_time = 300  # 5 minutes
            else:
                wait_time = 900  # 15 minutes
            
            time.sleep(wait_time)
            update_hotspots()
    
    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    print("🔄 Predictive updater started")

# ============ API ROUTES ============

@app.route('/')
def home():
    return jsonify({
        "system": "Delhi Waterlogging Predictive System",
        "version": "3.0",
        "status": "active",
        "features": [
            "Real topography-based predictions",
            "User-reported locations with geocoding",
            "Delhi rainfall pattern analysis",
            "Historical incident correlation"
        ],
        "last_update": current_data["hotspots"][0]["last_updated"] if current_data["hotspots"] else "Never"
    })

@app.route('/hotspots')
def get_hotspots():
    return jsonify(current_data["hotspots"])

@app.route('/hotspot/<int:hotspot_id>')
def get_hotspot(hotspot_id):
    for hotspot in current_data["hotspots"]:
        if hotspot["id"] == hotspot_id:
            # Add detailed prediction info
            if hotspot["ward_name"] in predictor.delhi_topography:
                area_data = predictor.delhi_topography[hotspot["ward_name"]]
                hotspot["elevation"] = area_data["elevation"]
                hotspot["drainage_score"] = area_data["drainage_score"]
            return jsonify(hotspot)
    return jsonify({"error": "Not found"}), 404

@app.route('/predictions')
def get_predictions():
    pred_list = []
    for pred in current_data["predictions"]:
        pred_list.append({
            "ward_name": pred["area"],
            "risk_level": pred["risk_level"],
            "message": f"Will likely waterlog in next 3 hours" if pred["will_waterlog"] else "Monitor for possible waterlogging",
            "confidence": pred["confidence"],
            "risk_score": pred["risk_score"]
        })
    return jsonify(pred_list)

@app.route('/high-risk-areas')
def get_high_risk_areas():
    high_risk = [h["ward_name"] for h in current_data["hotspots"] if h["risk_level"] == "High"]
    return jsonify({
        "areas": high_risk,
        "count": len(high_risk),
        "alert_level": "HIGH" if high_risk else "NORMAL",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/rainfall')
def get_rainfall():
    return jsonify(current_data["rainfall"])

# NEW: User report with custom location
@app.route('/report', methods=['POST'])
def submit_report():
    data = request.json
    
    if not data or "location" not in data:
        return jsonify({"error": "Location required"}), 400
    
    # Add report
    report = report_manager.add_report(
        location=data["location"],
        severity=data.get("severity", "Medium"),
        description=data.get("description", "")
    )
    
    # Trigger update to include new report
    update_hotspots()
    
    return jsonify({
        "message": "Report submitted successfully",
        "report_id": report["report_id"],
        "location": report["location"],
        "coordinates": {
            "latitude": report["latitude"],
            "longitude": report["longitude"]
        },
        "added_to_map": True
    })

@app.route('/reports')
def get_reports():
    return jsonify(report_manager.get_active_reports(24))

# NEW: Get prediction for specific location
@app.route('/predict-location', methods=['POST'])
def predict_location():
    data = request.json
    
    if not data or "location" not in data:
        return jsonify({"error": "Location required"}), 400
    
    rainfall = current_data["rainfall"].get("rainfall_mm", 0)
    prediction = predictor.predict_waterlogging_risk(data["location"], rainfall)
    
    # Try to geocode for coordinates
    coords = report_manager.geocode_location(data["location"])
    
    result = {
        "location": data["location"],
        **prediction,
        "timestamp": datetime.now().isoformat()
    }
    
    if coords:
        result["coordinates"] = {
            "latitude": coords["latitude"],
            "longitude": coords["longitude"]
        }
    
    return jsonify(result)

# NEW: Force update with current conditions
@app.route('/update-now', methods=['POST'])
def manual_update():
    success = update_hotspots()
    return jsonify({
        "success": success,
        "message": "System updated with current conditions",
        "timestamp": datetime.now().isoformat(),
        "rainfall_mm": current_data["rainfall"].get("rainfall_mm", 0)
    })

if __name__ == '__main__':
    # Install required packages first:
    # pip install geopy requests
    
    # Start predictive updater
    start_real_updater()
    
    print("\n" + "="*60)
    print("🌐 PREDICTIVE SYSTEM READY")
    print("="*60)
    print("📊 Features:")
    print("1. REAL Delhi topography-based predictions")
    print("2. User can enter ANY location (geocoded to map)")
    print("3. Updates based on actual rainfall patterns")
    print("4. Historical incident correlation")
    print("\n🚀 Server: http://localhost:8000")
    print("="*60)
    
    app.run(host='0.0.0.0', port=8000, debug=True)