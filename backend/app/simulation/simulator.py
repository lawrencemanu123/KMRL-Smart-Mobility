"""Real-Time Transit Simulation Engine for KMLR.

Simulates real-time delays, disruptions, weather changes, and traffic conditions
in the Kochi Metropolitan Region to power dynamic rerouting and live status boards.
"""
from typing import Dict, Any, List
import datetime


class SimulationEngine:
    """Manages simulated live operational status and disruptions."""

    def __init__(self):
        self.simulation_mode = True
        self.weather_condition = "Clear"
        self.traffic_level = 2  # 1=Light, 2=Moderate, 3=Heavy, 4=Severe
        self.line_delays: Dict[str, float] = {
            "Kochi Metro Line 1": 0.0,
            "High Court - Vypin": 0.0,
            "High Court - Bolgatty": 0.0,
            "High Court - Fort Kochi": 0.0,
            "High Court - South Chittoor": 0.0,
            "Vyttila - Kakkanad": 0.0,
            "City Bus Line 4": 2.0,
            "Infopark Feeder Line 1": 3.0,
            "West Kochi - City Feeder": 2.0
        }
        self.active_alerts: List[Dict[str, Any]] = [
            {
                "id": "ALERT_001",
                "mode": "metro",
                "line": "Kochi Metro Line 1",
                "severity": "normal",
                "title": "Kochi Metro Operating Normally",
                "description": "All 25 stations from Aluva to Thripunithura operating on standard 7-minute headways.",
                "delay_minutes": 0,
                "timestamp": datetime.datetime.now().strftime("%H:%M")
            },
            {
                "id": "ALERT_002",
                "mode": "water_metro",
                "line": "High Court - Fort Kochi",
                "severity": "normal",
                "title": "Water Metro Operating Normally",
                "description": "Electric hybrid ferry services between High Court, Vypin, and Fort Kochi running on schedule.",
                "delay_minutes": 0,
                "timestamp": datetime.datetime.now().strftime("%H:%M")
            }
        ]

    def get_live_delays(self) -> Dict[str, float]:
        """Return currently active delays per transit line."""
        return self.line_delays.copy()

    def get_live_network_status(self) -> Dict[str, Any]:
        """Return comprehensive network-wide health status."""
        lines_status = []
        for line_name, delay in self.line_delays.items():
            mode = "water_metro" if "Water" in line_name or "High Court" in line_name or "Vyttila - Kakkanad" in line_name else ("metro" if "Metro" in line_name else "feeder_bus")
            if delay == 0:
                status = "On Time"
                severity = "normal"
            elif delay < 5:
                status = f"Minor Delay (+{int(delay)} min)"
                severity = "low"
            else:
                status = f"Service Delayed (+{int(delay)} min)"
                severity = "severe"

            lines_status.append({
                "line_name": line_name,
                "mode": mode,
                "delay_minutes": delay,
                "status": status,
                "severity": severity,
                "frequency_min": 7 if mode == "metro" else (15 if mode == "water_metro" else 10)
            })

        return {
            "simulation_mode": True,
            "weather": self.weather_condition,
            "traffic_level": self.traffic_level,
            "lines": lines_status,
            "alerts": self.active_alerts,
            "last_updated": datetime.datetime.now().strftime("%H:%M:%S")
        }

    def trigger_water_metro_delay(self, delay_minutes: float = 12.0) -> Dict[str, Any]:
        """Simulate high ferry traffic or weather disruption on the Water Metro."""
        self.line_delays["High Court - Fort Kochi"] = delay_minutes
        self.line_delays["High Court - Vypin"] = max(delay_minutes - 4.0, 4.0)

        alert = {
            "id": f"DISRUPT_{int(datetime.datetime.now().timestamp())}",
            "mode": "water_metro",
            "line": "High Court - Fort Kochi",
            "severity": "severe",
            "title": "Water Metro Service Disruption: Channel Congestion",
            "description": f"Ferry services on High Court - Fort Kochi corridor experiencing approximately {int(delay_minutes)} min delay due to channel maintenance.",
            "delay_minutes": int(delay_minutes),
            "timestamp": datetime.datetime.now().strftime("%H:%M")
        }

        # Remove previous alert for this line if present
        self.active_alerts = [a for a in self.active_alerts if a["line"] != "High Court - Fort Kochi"]
        self.active_alerts.insert(0, alert)

        return {
            "success": True,
            "message": f"Simulated {int(delay_minutes)} minute disruption on High Court - Fort Kochi Water Metro.",
            "affected_line": "High Court - Fort Kochi",
            "delay_minutes": delay_minutes
        }

    def trigger_bus_delay(self, delay_minutes: float = 15.0) -> Dict[str, Any]:
        """Simulate heavy road congestion affecting feeder buses."""
        self.line_delays["City Bus Line 4"] = delay_minutes
        self.traffic_level = 4

        alert = {
            "id": f"DISRUPT_{int(datetime.datetime.now().timestamp())}",
            "mode": "feeder_bus",
            "line": "City Bus Line 4",
            "severity": "severe",
            "title": "Severe Road Traffic on MG Road / Kaloor Corridor",
            "description": f"Feeder buses delayed by {int(delay_minutes)} min due to heavy arterial junction traffic.",
            "delay_minutes": int(delay_minutes),
            "timestamp": datetime.datetime.now().strftime("%H:%M")
        }
        self.active_alerts.insert(0, alert)
        return {"success": True, "message": f"Simulated bus traffic delay of {int(delay_minutes)} min."}

    def reset_simulation(self) -> Dict[str, Any]:
        """Reset all delays and return transit network to on-time state."""
        for k in self.line_delays:
            self.line_delays[k] = 0.0
        self.weather_condition = "Clear"
        self.traffic_level = 2
        self.active_alerts = [
            {
                "id": "ALERT_001",
                "mode": "metro",
                "line": "Kochi Metro Line 1",
                "severity": "normal",
                "title": "Kochi Metro Operating Normally",
                "description": "All 25 stations operating on standard 7-minute headways.",
                "delay_minutes": 0,
                "timestamp": datetime.datetime.now().strftime("%H:%M")
            },
            {
                "id": "ALERT_002",
                "mode": "water_metro",
                "line": "High Court - Fort Kochi",
                "severity": "normal",
                "title": "Water Metro Operating Normally",
                "description": "Ferry services running on standard schedule.",
                "delay_minutes": 0,
                "timestamp": datetime.datetime.now().strftime("%H:%M")
            }
        ]
        return {"success": True, "message": "Simulation reset: all transit modes are running on time."}


# Global simulation singleton
sim_engine = SimulationEngine()
