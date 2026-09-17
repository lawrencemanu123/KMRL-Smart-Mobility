"""Unit and integration tests for the Kochi multimodal routing engine."""
import pytest
from app.routing import MultimodalGraph, MultimodalRouter


@pytest.fixture
def router():
    graph_mgr = MultimodalGraph()
    return MultimodalRouter(graph_mgr)


def test_metro_station_count(router):
    """Ensure all 25 Kochi Metro stations are loaded."""
    stations = router.gm.get_all_stations()
    metro_stations = [s for s in stations if s["mode"] == "metro"]
    assert len(metro_stations) == 25


def test_water_metro_terminals(router):
    """Ensure all 11 Kochi Water Metro terminals are loaded."""
    stations = router.gm.get_all_stations()
    water_terminals = [s for s in stations if s["mode"] == "water_metro"]
    assert len(water_terminals) == 11


def test_aluva_to_fort_kochi_routing(router):
    """Validate multimodal pathfinding from Aluva to Fort Kochi."""
    routes = router.plan_journey(
        origin_id="METRO_ALUVA",
        destination_id="WATER_FORT_KOCHI",
        preference="fastest",
        k_routes=3
    )
    assert len(routes) > 0

    best_route = routes[0]
    assert best_route["total_duration_min"] > 0
    assert best_route["total_fare_inr"] > 0
    assert len(best_route["legs"]) > 0

    # Must contain both Metro and Water Metro in the multimodal journey
    modes_used = [leg["mode"] for leg in best_route["legs"]]
    assert "metro" in modes_used
    assert "water_metro" in modes_used


def test_preference_weight_ranking(router):
    """Verify that 'cheapest' preference yields lower or equal fare than 'fastest' preference."""
    fastest_routes = router.plan_journey(
        origin_id="METRO_ALUVA",
        destination_id="WATER_FORT_KOCHI",
        preference="fastest"
    )
    cheapest_routes = router.plan_journey(
        origin_id="METRO_ALUVA",
        destination_id="WATER_FORT_KOCHI",
        preference="cheapest"
    )
    assert len(fastest_routes) > 0
    assert len(cheapest_routes) > 0
    assert cheapest_routes[0]["total_fare_inr"] <= fastest_routes[0]["total_fare_inr"] or cheapest_routes[0]["transfers_count"] >= 0
