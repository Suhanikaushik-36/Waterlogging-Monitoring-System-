from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Load data
with open("data.json", "r") as f:
    data = json.load(f)

# 🔴 FEATURE 1: Home
@app.route('/')
def home():
    return jsonify({
        "message": "Delhi Water-Logging API",
        "version": "1.0",
        "status": "active"
    })

# 🔴 FEATURE 2: Get all hotspots
@app.route('/hotspots', methods=['GET'])
def get_hotspots():
    return jsonify(data["hotspots"])

# 🔴 FEATURE 3: Get single hotspot
@app.route('/hotspot/<int:hotspot_id>', methods=['GET'])
def get_hotspot(hotspot_id):
    for hotspot in data["hotspots"]:
        if hotspot["id"] == hotspot_id:
            return jsonify(hotspot)
    return jsonify({"error": "Not found"}), 404

# 🔴 FEATURE 4: Risk predictions
@app.route('/predictions', methods=['GET'])
def get_predictions():
    predictions = []
    
    for hotspot in data["hotspots"]:
        # Simple rule-based logic
        risk_score = 0
        
        # Rainfall factor
        if hotspot["rainfall_mm"] > 100:
            risk_score += 40
        elif hotspot["rainfall_mm"] > 50:
            risk_score += 20
        
        # Drainage factor
        if hotspot["drainage_status"] == "Weak":
            risk_score += 30
        elif hotspot["drainage_status"] == "Moderate":
            risk_score += 20
        
        # Severity factor
        risk_score += hotspot["severity_score"] * 2
        
        # Determine risk
        if risk_score >= 70:
            risk_level = "High"
            message = "High probability of water-logging"
        elif risk_score >= 50:
            risk_level = "Medium"
            message = "Possible water-logging"
        else:
            risk_level = "Low"
            message = "Low risk currently"
        
        if risk_level in ["High", "Medium"]:
            predictions.append({
                "ward_name": hotspot["ward_name"],
                "risk_level": risk_level,
                "message": message,
                "confidence": 75 if risk_level == "High" else 60
            })
    
    return jsonify(predictions)

# 🔴 FEATURE 5: High risk areas
@app.route('/high-risk-areas', methods=['GET'])
def get_high_risk_areas():
    high_risk = []
    for hotspot in data["hotspots"]:
        if hotspot["risk_level"] == "High":
            high_risk.append(hotspot["ward_name"])
    
    return jsonify({
        "areas": high_risk,
        "count": len(high_risk),
        "alert_level": "HIGH" if high_risk else "NORMAL"
    })

# Rainfall data
@app.route('/rainfall', methods=['GET'])
def get_rainfall():
    return jsonify(data["rainfall"])

# Report submission
@app.route('/report', methods=['POST'])
def submit_report():
    report_data = request.json
    report_id = len(data["reports"]) + 1
    
    new_report = {
        "report_id": report_id,
        **report_data
    }
    
    data["reports"].append(new_report)
    
    # Save to file
    with open("data.json", "w") as f:
        json.dump(data, f, indent=2)
    
    return jsonify({
        "message": "Report submitted",
        "report_id": report_id
    })

# Get all reports
@app.route('/reports', methods=['GET'])
def get_reports():
    return jsonify(data["reports"])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)