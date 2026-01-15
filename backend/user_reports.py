# backend/user_reports.py
import json
from datetime import datetime
from geopy.geocoders import Nominatim
from typing import Dict, List, Optional
import time

class UserReportManager:
    """Manages real user-reported waterlogging locations"""
    
    def __init__(self):
        self.geolocator = Nominatim(user_agent="delhi_waterlogging_app")
        self.reports_file = "user_reports.json"
        self.load_reports()
    
    def load_reports(self):
        """Load existing user reports"""
        try:
            with open(self.reports_file, "r") as f:
                self.reports = json.load(f)
        except FileNotFoundError:
            self.reports = []
    
    def save_reports(self):
        """Save reports to file"""
        with open(self.reports_file, "w") as f:
            json.dump(self.reports, f, indent=2)
    
    def geocode_location(self, location_name: str) -> Optional[Dict]:
        """Convert location name to coordinates"""
        try:
            # Add Delhi context for better accuracy
            query = f"{location_name}, Delhi, India"
            location = self.geolocator.geocode(query, timeout=10)
            
            if location:
                return {
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "address": location.address
                }
        except Exception as e:
            print(f"Geocoding error for {location_name}: {e}")
        
        return None
    
    def add_report(self, location: str, severity: str, description: str = "") -> Dict:
        """Add a new user report"""
        
        # Geocode the location
        coords = self.geocode_location(location)
        
        if not coords:
            # Fallback: Use approximate Delhi coordinates
            coords = {
                "latitude": 28.6139 + (random.random() * 0.1 - 0.05),
                "longitude": 77.2090 + (random.random() * 0.1 - 0.05),
                "address": f"{location}, Delhi (approx)"
            }
        
        report_id = len(self.reports) + 1
        report = {
            "report_id": report_id,
            "location": location,
            "severity": severity,
            "description": description,
            "latitude": coords["latitude"],
            "longitude": coords["longitude"],
            "address": coords["address"],
            "reported_at": datetime.now().isoformat(),
            "verified": False,
            "status": "active"
        }
        
        self.reports.append(report)
        self.save_reports()
        
        return report
    
    def get_active_reports(self, hours: int = 24) -> List[Dict]:
        """Get reports from last X hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        
        active_reports = []
        for report in self.reports:
            reported_time = datetime.fromisoformat(report["reported_at"].replace('Z', '+00:00'))
            if reported_time >= cutoff and report["status"] == "active":
                active_reports.append(report)
        
        return active_reports
    
    def verify_report(self, report_id: int, verified: bool = True):
        """Verify a user report"""
        for report in self.reports:
            if report["report_id"] == report_id:
                report["verified"] = verified
                if verified:
                    report["status"] = "verified"
                break
        
        self.save_reports()

# Singleton instance
report_manager = UserReportManager()