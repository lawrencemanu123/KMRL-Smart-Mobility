"""Multimodal Routing Engine for KMLR.

Computes candidate journeys across Metro, Water Metro, Feeder Buses, Autos, and Walking.
Applies weighted multi-criteria routing, transfer analysis, and personalized ranking.
"""
import networkx as nx
from typing import List, Dict, Any, Optional
from .graph import MultimodalGraph, haversine_distance
from .cost_function import calculate_edge_cost, assess_transfer_feasibility, PREFERENCE_WEIGHTS


class MultimodalRouter:
    """Computes, scores, and ranks multimodal transit routes."""

    def __init__(self, graph_manager: MultimodalGraph):
        self.gm = graph_manager
        self.G = graph_manager.graph

    def plan_journey(
        self,
        origin_id: str,
        destination_id: str,
        preference: str = "fastest",
        max_walking_meters: int = 1500,
        avoid_modes: Optional[List[str]] = None,
        live_delays: Optional[Dict[str, float]] = None,
        k_routes: int = 4
    ) -> List[Dict[str, Any]]:
        """Find up to k diverse multimodal candidate routes ranked according to user preference."""
        if avoid_modes is None:
            avoid_modes = []
        if live_delays is None:
            live_delays = {}

        if origin_id not in self.G or destination_id not in self.G:
            return []

        # Construct a simple DiGraph where each (u, v) edge retains the lowest-cost option
        simple_G = nx.DiGraph()
        for node, attrs in self.G.nodes(data=True):
            simple_G.add_node(node, **attrs)

        for u, v, key, data in self.G.edges(keys=True, data=True):
            mode = data.get("mode", "walking")
            if mode in avoid_modes:
                continue
            if mode == "walking" and (data.get("distance_km", 0.0) * 1000 > max_walking_meters):
                continue
            delay = live_delays.get(data.get("line", ""), 0.0)
            cost = calculate_edge_cost(data, preference=preference, live_delay=delay)

            if not simple_G.has_edge(u, v) or cost < simple_G[u][v]["cost"]:
                simple_G.add_edge(u, v, cost=cost, best_key=key, **data)

        # Generate k diverse paths
        try:
            path_generator = nx.shortest_simple_paths(simple_G, origin_id, destination_id, weight="cost")
            candidate_paths = []
            for path in path_generator:
                candidate_paths.append(path)
                if len(candidate_paths) >= k_routes * 3:
                    break
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []


        # Convert node sequences to structured multimodal journey objects
        raw_journeys = []
        for path in candidate_paths:
            journey = self._build_journey_from_path(path, preference, live_delays)
            if journey and journey["total_duration_min"] > 0:
                raw_journeys.append(journey)

        # Deduplicate journeys by mode sequence and total duration
        unique_journeys = []
        seen_signatures = set()
        for j in raw_journeys:
            modes = "-".join([leg["mode"] for leg in j["legs"] if leg["mode"] != "walking" or leg["distance_km"] > 0.4])
            sig = f"{modes}_{round(j['total_duration_min'], -1)}"
            if sig not in seen_signatures:
                seen_signatures.add(sig)
                unique_journeys.append(j)
            if len(unique_journeys) >= k_routes:
                break

        # If empty (due to filter), fallback to at least raw journeys
        if not unique_journeys and raw_journeys:
            unique_journeys = raw_journeys[:k_routes]

        # Rank routes intelligently according to preference
        ranked_journeys = self._rank_journeys(unique_journeys, preference)
        return ranked_journeys

    def _build_journey_from_path(
        self,
        node_path: List[str],
        preference: str,
        live_delays: Dict[str, float]
    ) -> Optional[Dict[str, Any]]:
        """Construct detailed journey legs, transfer checks, coordinates, and aggregates."""
        legs = []
        total_duration = 0.0
        total_walking_time = 0.0
        total_waiting_time = 0.0
        total_fare = 0.0
        total_distance = 0.0
        total_co2 = 0.0
        predicted_delay = 0.0
        current_clock_min = 0.0

        # Consolidate consecutive hops belonging to the same line
        consolidated_legs = []
        for i in range(len(node_path) - 1):
            u = node_path[i]
            v = node_path[i + 1]

            # Select the most suitable edge between u and v
            best_edge_data = None
            best_cost = float("inf")

            for key, data in self.G[u][v].items():
                delay = live_delays.get(data.get("line", ""), 0.0)
                cost = calculate_edge_cost(data, preference=preference, live_delay=delay)
                if cost < best_cost:
                    best_cost = cost
                    best_edge_data = data

            if not best_edge_data:
                return None

            mode = best_edge_data.get("mode", "walking")
            dist = best_edge_data.get("distance_km", 0.5)
            base_time = best_edge_data.get("base_time_min", 3.0)
            line_name = best_edge_data.get("line", "Walk")
            fare = best_edge_data.get("fare", 0.0)
            co2 = best_edge_data.get("co2_g_per_km", 0.0) * dist / 1000.0  # kg
            freq = best_edge_data.get("frequency_min", 0)
            delay = live_delays.get(line_name, 0.0)

            u_node = self.G.nodes[u]
            v_node = self.G.nodes[v]

            edge_geom = best_edge_data.get("geometry")
            if not edge_geom:
                edge_geom = [[u_node.get("lat"), u_node.get("lon")], [v_node.get("lat"), v_node.get("lon")]]
            else:
                # Orient geometry in the direction of travel u -> v
                if len(edge_geom) >= 2:
                    start_pt = edge_geom[0]
                    dist_u = haversine_distance(u_node["lat"], u_node["lon"], start_pt[0], start_pt[1])
                    dist_v = haversine_distance(v_node["lat"], v_node["lon"], start_pt[0], start_pt[1])
                    if dist_v < dist_u:
                        edge_geom = [list(pt) for pt in reversed(edge_geom)]
                    else:
                        edge_geom = [list(pt) for pt in edge_geom]

            # If previous leg is on the EXACT same transit line, merge with previous leg
            if consolidated_legs and consolidated_legs[-1]["line"] == line_name and mode not in ["walking", "auto"]:
                prev = consolidated_legs[-1]
                prev["to_station_id"] = v
                prev["to_station_name"] = v_node.get("name", v)
                prev["to_coord"] = [v_node.get("lat"), v_node.get("lon")]
                for pt in edge_geom[1:]:
                    prev["path_coords"].append(pt)
                prev["distance_km"] = round(prev["distance_km"] + dist, 2)
                prev["in_vehicle_time_min"] = round(prev["in_vehicle_time_min"] + base_time, 1)
                prev["duration_min"] = round(prev["in_vehicle_time_min"] + prev["waiting_time_min"] + prev["delay_min"], 1)
                # Recalculate metro/bus progressive fare based on total distance
                if mode == "metro":
                    prev["fare_inr"] = round(min(60.0, 10.0 + prev["distance_km"] * 2.0), 1)
                elif mode == "feeder_bus":
                    prev["fare_inr"] = round(min(35.0, 10.0 + prev["distance_km"] * 1.5), 1)
                else:
                    prev["fare_inr"] += fare
            else:
                # Wait time estimate only upon initial boarding
                wait_time = (freq / 2.0) if (freq > 0 and mode not in ["walking", "auto"]) else 0.0

                leg = {
                    "leg_index": len(consolidated_legs),
                    "mode": mode,
                    "line": line_name,
                    "from_station_id": u,
                    "from_station_name": u_node.get("name", u),
                    "to_station_id": v,
                    "to_station_name": v_node.get("name", v),
                    "from_coord": [u_node.get("lat"), u_node.get("lon")],
                    "to_coord": [v_node.get("lat"), v_node.get("lon")],
                    "path_coords": [list(pt) for pt in edge_geom],
                    "distance_km": round(dist, 2),
                    "duration_min": round(base_time + wait_time + delay, 1),
                    "in_vehicle_time_min": round(base_time, 1),
                    "waiting_time_min": round(wait_time, 1),
                    "delay_min": round(delay, 1),
                    "fare_inr": fare,
                    "color": best_edge_data.get("color", "#0284c7")
                }

                if consolidated_legs and consolidated_legs[-1]["mode"] != mode and mode in ["metro", "water_metro", "feeder_bus"]:
                    transfer_assessment = assess_transfer_feasibility(
                        arrival_time_min=current_clock_min,
                        transfer_walk_min=base_time if mode == "walking" else 2.0,
                        next_departure_min=current_clock_min + wait_time + 1.0
                    )
                    leg["transfer_safety"] = transfer_assessment

                consolidated_legs.append(leg)

            current_clock_min += base_time
            total_co2 += co2

        # Compute summary aggregates from consolidated legs
        total_duration = sum(l["duration_min"] for l in consolidated_legs)
        total_walking_time = sum(l["duration_min"] for l in consolidated_legs if l["mode"] == "walking")
        total_waiting_time = sum(l["waiting_time_min"] for l in consolidated_legs)
        total_fare = sum(l["fare_inr"] for l in consolidated_legs)
        total_distance = sum(l["distance_km"] for l in consolidated_legs)
        predicted_delay = sum(l["delay_min"] for l in consolidated_legs)

        # Count vehicle transfers (ignoring pure walking links)
        transit_modes = [leg["mode"] for leg in consolidated_legs if leg["mode"] not in ["walking"]]
        transfers_count = max(0, len([l for l in consolidated_legs if l["mode"] not in ["walking"]]) - 1)

        # Generate Explainable AI (XAI) rationale badges
        reasons = self._generate_recommendation_reason(
            consolidated_legs, total_duration, total_fare, transfers_count, predicted_delay, preference
        )

        return {
            "origin_id": node_path[0],
            "origin_name": self.G.nodes[node_path[0]].get("name"),
            "destination_id": node_path[-1],
            "destination_name": self.G.nodes[node_path[-1]].get("name"),
            "total_duration_min": round(total_duration, 1),
            "walking_time_min": round(total_walking_time, 1),
            "waiting_time_min": round(total_waiting_time, 1),
            "total_fare_inr": round(total_fare, 1),
            "total_distance_km": round(total_distance, 2),
            "co2_saved_kg": round(max(0.1, (total_distance * 0.14) - total_co2), 2),
            "transfers_count": transfers_count,
            "predicted_delay_min": round(predicted_delay, 1),
            "primary_modes": list(dict.fromkeys(transit_modes)) or ["walking"],
            "legs": consolidated_legs,
            "recommendation_badges": reasons,
            "confidence_score": round(max(0.70, 0.98 - (predicted_delay * 0.02) - (transfers_count * 0.03)), 2)
        }


    def _generate_recommendation_reason(
        self,
        legs: List[Dict[str, Any]],
        duration: float,
        fare: float,
        transfers: int,
        delay: float,
        preference: str
    ) -> List[str]:
        """Produce clear, human-understandable justification badges for this route."""
        badges = []
        modes = [leg["mode"] for leg in legs]

        if "water_metro" in modes:
            badges.append("Scenic & Zero Road Congestion via Water Metro")
        if "metro" in modes:
            badges.append("High Reliability via Kochi Metro")
        if delay == 0.0:
            badges.append("On Time Service (0 min predicted delay)")
        elif delay > 5.0:
            badges.append(f"Minor Disruption: +{round(delay)} min delay expected")

        if preference == "cheapest" or fare < 35.0:
            badges.append(f"Budget-Friendly (₹{int(fare)})")
        if preference == "fastest" or duration < 40.0:
            badges.append(f"Rapid Transit ({int(duration)} min)")
        if transfers <= 1:
            badges.append(f"Seamless Connection ({transfers} transfer)")
        if preference == "eco":
            badges.append("Eco-Certified: 85% Lower Carbon Emissions")

        return badges[:4]

    def _rank_journeys(self, journeys: List[Dict[str, Any]], preference: str) -> List[Dict[str, Any]]:
        """Score and sort candidate journeys according to the preference profile."""
        weights = PREFERENCE_WEIGHTS.get(preference, PREFERENCE_WEIGHTS["fastest"])

        for j in journeys:
            score = (
                weights["w_time"] * j["total_duration_min"]
                + weights["w_wait"] * j["waiting_time_min"]
                + weights["w_fare"] * (j["total_fare_inr"] * 0.8)
                + weights["w_transfer"] * (j["transfers_count"] * 10.0)
                + weights["w_walk"] * j["walking_time_min"]
                + weights["w_delay"] * j["predicted_delay_min"] * 1.5
            )
            j["ranking_score"] = round(score, 2)

        journeys.sort(key=lambda x: x["ranking_score"])

        # Tag the top candidate with "Recommended"
        if journeys:
            journeys[0]["is_recommended"] = True
            for other in journeys[1:]:
                other["is_recommended"] = False

        return journeys
