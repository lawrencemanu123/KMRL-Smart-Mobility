import os
import sys
import httpx

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

client = httpx.Client(base_url="http://127.0.0.1:8000")


def test_demo_flow():
    print("========================================")
    print("1. Health Check")
    health = client.get("/health").json()
    print("Health:", health)

    print("\n========================================")
    print("2. Route Search: Aluva to Fort Kochi")
    res = client.post("/api/routes/search", json={
        "origin_id": "METRO_ALUVA",
        "destination_id": "WATER_FORT_KOCHI",
        "preference": "fastest"
    }).json()

    print(f"Origin: {res['origin']} -> Destination: {res['destination']}")
    print(f"Found {len(res['routes'])} multimodal candidate routes:\n")

    for i, r in enumerate(res["routes"]):
        modes = " -> ".join([leg["line"] for leg in r["legs"] if leg["mode"] != "walking" or leg["distance_km"] > 0.4])
        print(f"Route {i+1} [Score {r['ranking_score']}]: {r['total_duration_min']} min | Fare: Rs {r['total_fare_inr']} | Transfers: {r['transfers_count']}")
        print(f"   Corridor: {modes}")
        print(f"   AI Badges: {r['recommendation_badges']}\n")

    print("========================================")
    print("3. Simulating Water Metro 12-min Delay")
    client.post("/api/live/simulate/water-metro-delay", params={"delay_minutes": 12.0})

    print("\n4. Testing AI Dynamic Rerouting Endpoint")
    reroute = client.post("/api/routes/reroute", json={
        "current_station_id": "METRO_MG_ROAD",
        "destination_id": "WATER_FORT_KOCHI",
        "preference": "fastest"
    }).json()

    print("Disruption Detected:", reroute["disruption_detected"])
    print("Alert Message:", reroute["notification_message"])
    print("Time Saved via Alternate Route:", reroute["time_saved_min"], "minutes")
    if reroute["new_recommended_route"]:
        alt_modes = " -> ".join([l["line"] for l in reroute["new_recommended_route"]["legs"]])
        print("Recommended Alternative Itinerary:", alt_modes)

    print("\n========================================")
    print("5. Resetting Simulation")
    client.post("/api/live/simulate/reset")
    print("Simulation reset to normal successfully.")
    print("========================================")


if __name__ == "__main__":
    test_demo_flow()
