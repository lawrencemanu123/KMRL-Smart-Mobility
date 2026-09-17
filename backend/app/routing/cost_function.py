"""Generalized Multimodal Route Cost Function and Transfer Optimization for KMLR."""
from typing import Dict, Any


# Weight configuration matrix based on user preferences
PREFERENCE_WEIGHTS = {
    "fastest": {
        "w_time": 1.0,
        "w_wait": 0.8,
        "w_fare": 0.15,
        "w_transfer": 5.0,
        "w_walk": 0.7,
        "w_delay": 1.0,
        "w_eco": 0.05
    },
    "cheapest": {
        "w_time": 0.35,
        "w_wait": 0.3,
        "w_fare": 1.6,
        "w_transfer": 2.5,
        "w_walk": 0.2,
        "w_delay": 0.4,
        "w_eco": 0.05
    },
    "min_transfers": {
        "w_time": 0.7,
        "w_wait": 0.5,
        "w_fare": 0.3,
        "w_transfer": 25.0,  # strong transfer penalty
        "w_walk": 0.6,
        "w_delay": 0.7,
        "w_eco": 0.05
    },
    "comfortable": {
        "w_time": 0.65,
        "w_wait": 1.2,
        "w_fare": 0.25,
        "w_transfer": 8.0,
        "w_walk": 2.2,  # heavy penalty on long walks
        "w_delay": 1.1,
        "w_eco": 0.05
    },
    "eco": {
        "w_time": 0.5,
        "w_wait": 0.4,
        "w_fare": 0.2,
        "w_transfer": 3.0,
        "w_walk": 0.1,  # walking is encouraged
        "w_delay": 0.5,
        "w_eco": 1.8   # heavy reward for low carbon footprint
    }
}


def calculate_edge_cost(edge_data: Dict[str, Any], preference: str = "fastest", live_delay: float = 0.0) -> float:
    """Compute generalized cost of traversing a graph edge."""
    weights = PREFERENCE_WEIGHTS.get(preference, PREFERENCE_WEIGHTS["fastest"])

    travel_time = edge_data.get("base_time_min", 2.0)
    mode = edge_data.get("mode", "walking")
    fare = edge_data.get("fare", 0.0)
    co2 = edge_data.get("co2_g_per_km", 0.0) * edge_data.get("distance_km", 1.0) / 1000.0  # kg

    # Headway-based expected waiting time (Poisson arrivals: wait = headway / 2)
    freq = edge_data.get("frequency_min", 0)
    waiting_time = freq / 2.0 if freq > 0 else 0.0

    walking_time = travel_time if mode == "walking" else 0.0

    cost = (
        weights["w_time"] * travel_time
        + weights["w_wait"] * waiting_time
        + weights["w_fare"] * fare
        + weights["w_walk"] * walking_time
        + weights["w_delay"] * live_delay
        + weights["w_eco"] * co2 * 10.0
    )
    return max(0.1, round(cost, 3))


def assess_transfer_feasibility(arrival_time_min: float, transfer_walk_min: float, next_departure_min: float) -> Dict[str, Any]:
    """Assess whether a multimodal transfer is safe and reliable.

    Identifies tight transfers (< minimum buffer) or missed connections.
    """
    buffer_min = next_departure_min - (arrival_time_min + transfer_walk_min)
    if buffer_min < 0:
        return {
            "feasible": False,
            "safety": "missed",
            "message": "Connection too tight: Walk time exceeds scheduled departure. Recommending next service."
        }
    elif buffer_min < 3.0:
        return {
            "feasible": True,
            "safety": "risky",
            "message": f"Tight connection ({round(buffer_min, 1)} min buffer). Proceed swiftly."
        }
    else:
        return {
            "feasible": True,
            "safety": "safe",
            "message": f"Comfortable transfer ({round(buffer_min, 1)} min buffer)."
        }
