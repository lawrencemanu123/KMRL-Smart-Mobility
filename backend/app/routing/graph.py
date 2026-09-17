"""Multimodal Transportation Network Graph for Kochi Metropolitan Region.

Constructs a directed multigraph representing:
- Kochi Metro (Blue Line: Aluva to Thripunithura)
- Kochi Water Metro (High Court, Vypin, Fort Kochi, Bolgatty, etc.)
- Feeder Buses (KSRTC/KMRL Feeder routes)
- Auto-rickshaw first/last-mile connections
- Dedicated walking & cycling transfer paths
"""
import math
import networkx as nx
from typing import Dict, List, Any, Optional

# Earth radius in kilometers for Haversine distance
EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in km."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


# 1. KOCHI METRO STATIONS (Blue Line: 25 Stations)
METRO_STATIONS = [
    {"id": "METRO_ALUVA", "name": "Aluva", "lat": 10.1098, "lon": 76.3571, "is_terminal": True},
    {"id": "METRO_PULINCHODU", "name": "Pulinchodu", "lat": 10.0964, "lon": 76.3475},
    {"id": "METRO_COMPANYPADY", "name": "Companypady", "lat": 10.0863, "lon": 76.3402},
    {"id": "METRO_AMBATTUKAVU", "name": "Ambattukavu", "lat": 10.0772, "lon": 76.3347},
    {"id": "METRO_MUTTOM", "name": "Muttom", "lat": 10.0684, "lon": 76.3279},
    {"id": "METRO_KALAMASSERY", "name": "Kalamassery", "lat": 10.0535, "lon": 76.3204},
    {"id": "METRO_COCHIN_UNIVERSITY", "name": "Cochin University (CUSAT)", "lat": 10.0435, "lon": 76.3155},
    {"id": "METRO_PATHADIPALAM", "name": "Pathadipalam", "lat": 10.0337, "lon": 76.3113},
    {"id": "METRO_EDAPPALLY", "name": "Edappally", "lat": 10.0253, "lon": 76.3082},
    {"id": "METRO_CHANGAMPUZHA_PARK", "name": "Changampuzha Park", "lat": 10.0157, "lon": 76.3032},
    {"id": "METRO_PALARIVATTOM", "name": "Palarivattom", "lat": 10.0076, "lon": 76.3005},
    {"id": "METRO_JLN_STADIUM", "name": "JLN Stadium", "lat": 09.9984, "lon": 76.2996},
    {"id": "METRO_KALOOR", "name": "Kaloor", "lat": 09.9912, "lon": 76.2934},
    {"id": "METRO_LISSIE", "name": "Lissie", "lat": 09.9880, "lon": 76.2863},
    {"id": "METRO_MG_ROAD", "name": "M.G. Road", "lat": 09.9803, "lon": 76.2818},
    {"id": "METRO_MAHARAJAS", "name": "Maharaja's College", "lat": 09.9723, "lon": 76.2838},
    {"id": "METRO_ERNAKULAM_SOUTH", "name": "Ernakulam South", "lat": 09.9676, "lon": 76.2882},
    {"id": "METRO_KADAVANTHRA", "name": "Kadavanthra", "lat": 09.9678, "lon": 76.2989},
    {"id": "METRO_ELAMKULAM", "name": "Elamkulam", "lat": 09.9687, "lon": 76.3079},
    {"id": "METRO_VYTTILA", "name": "Vyttila Mobility Hub", "lat": 09.9671, "lon": 76.3197},
    {"id": "METRO_THYKOODAM", "name": "Thykoodam", "lat": 09.9576, "lon": 76.3242},
    {"id": "METRO_PETTA", "name": "Petta", "lat": 09.9515, "lon": 76.3361},
    {"id": "METRO_VADAKKEKOTTA", "name": "Vadakkekotta", "lat": 09.9501, "lon": 76.3448},
    {"id": "METRO_SN_JUNCTION", "name": "SN Junction", "lat": 09.9482, "lon": 76.3533},
    {"id": "METRO_THRIPUNITHURA", "name": "Thripunithura", "lat": 09.9475, "lon": 76.3601, "is_terminal": True},
]

# 2. KOCHI WATER METRO TERMINALS (Jetties)
WATER_METRO_TERMINALS = [
    {"id": "WATER_HIGH_COURT", "name": "High Court Water Metro", "lat": 09.9839, "lon": 76.2736, "is_terminal": True},
    {"id": "WATER_VYPIN", "name": "Vypin Water Metro", "lat": 09.9877, "lon": 76.2421, "is_terminal": True},
    {"id": "WATER_BOLGATTY", "name": "Bolgatty Water Metro", "lat": 09.9818, "lon": 76.2652},
    {"id": "WATER_FORT_KOCHI", "name": "Fort Kochi Water Metro", "lat": 09.9674, "lon": 76.2435, "is_terminal": True},
    {"id": "WATER_SOUTH_CHITTOOR", "name": "South Chittoor Water Metro", "lat": 10.0315, "lon": 76.2662},
    {"id": "WATER_CHERANALLOOR", "name": "Cheranalloor Water Metro", "lat": 10.0528, "lon": 76.2798},
    {"id": "WATER_ELOOR", "name": "Eloor Water Metro", "lat": 10.0732, "lon": 76.2985},
    {"id": "WATER_MATTANCHERRY", "name": "Mattancherry Water Metro", "lat": 09.9568, "lon": 76.2573},
    {"id": "WATER_WILLINGDON", "name": "Willingdon Island Water Metro", "lat": 09.9542, "lon": 76.2730},
    {"id": "WATER_KAKKANAD", "name": "Kakkanad (Chittethukara) Water Metro", "lat": 10.0072, "lon": 76.3644},
    {"id": "WATER_VYTTILA", "name": "Vyttila Jetty Water Metro", "lat": 09.9665, "lon": 76.3210, "is_terminal": True},
]

# 3. FEEDER BUS STOPS & HUBS
BUS_STOPS = [
    {"id": "BUS_ALUVA_STAND", "name": "Aluva KSRTC Bus Station", "lat": 10.1085, "lon": 76.3562},
    {"id": "BUS_EDAPPALLY_TOLL", "name": "Edappally Toll Bus Stop", "lat": 10.0245, "lon": 76.3095},
    {"id": "BUS_AMRITA_HOSPITAL", "name": "Amrita Hospital Bus Stop", "lat": 10.0345, "lon": 76.2952},
    {"id": "BUS_INFOPARK_EXPRESS", "name": "Infopark Campus Hub", "lat": 10.0102, "lon": 76.3621},
    {"id": "BUS_HIGH_COURT_JN", "name": "High Court Junction Bus Stop", "lat": 09.9822, "lon": 76.2755},
    {"id": "BUS_MARINE_DRIVE", "name": "Marine Drive Promenade Bus Stop", "lat": 09.9790, "lon": 76.2750},
    {"id": "BUS_MENAKA", "name": "Menaka Junction Bus Stop", "lat": 09.9768, "lon": 76.2782},
    {"id": "BUS_FORT_KOCHI_STAND", "name": "Fort Kochi Bus Terminus", "lat": 09.9655, "lon": 76.2442},
    {"id": "BUS_MATTANCHERRY_BAZAAR", "name": "Mattancherry Bazaar Bus Stop", "lat": 09.9550, "lon": 76.2588},
    {"id": "BUS_VYTTILA_HUB_BAY1", "name": "Vyttila Hub Bus Bay 1", "lat": 09.9668, "lon": 76.3188},
    {"id": "BUS_KAKKANAD_CIVIL", "name": "Kakkanad Civil Station", "lat": 10.0185, "lon": 76.3475},
    {"id": "BUS_THOPPUMPADY", "name": "Thoppumpady Junction", "lat": 09.9392, "lon": 76.2650},
]


# Curated road network corridors and water channels ensuring paths follow actual streets, bridges, and waterways
ROAD_AND_WATER_CORRIDORS: Dict[str, List[List[float]]] = {
    # West Kochi - City Feeder (Ernakulam South to Thoppumpady via Thevara & Alexander Parambithara Bridge over Willingdon Island)
    "BUS_THOPPUMPADY_METRO_ERNAKULAM_SOUTH": [
        [9.9676, 76.2882],
        [9.9670, 76.2840],
        [9.9540, 76.2910],
        [9.9360, 76.2990],
        [9.9325, 76.2890],
        [9.9330, 76.2830],
        [9.9340, 76.2780],
        [9.9355, 76.2690],
        [9.9392, 76.2650],
    ],
    # Heritage West Kochi road corridor (Thoppumpady to Fort Kochi Jetty via Palace Rd & Mattancherry Bazaar)
    "BUS_THOPPUMPADY_WATER_FORT_KOCHI": [
        [9.9392, 76.2650],
        [9.9480, 76.2610],
        [9.9550, 76.2588],
        [9.9610, 76.2510],
        [9.9655, 76.2442],
        [9.9674, 76.2435],
    ],
    "BUS_MATTANCHERRY_BAZAAR_BUS_THOPPUMPADY": [
        [9.9392, 76.2650],
        [9.9480, 76.2610],
        [9.9550, 76.2588],
    ],
    "BUS_FORT_KOCHI_STAND_BUS_MATTANCHERRY_BAZAAR": [
        [9.9550, 76.2588],
        [9.9610, 76.2510],
        [9.9655, 76.2442],
    ],
    "BUS_FORT_KOCHI_STAND_WATER_FORT_KOCHI": [
        [9.9655, 76.2442],
        [9.9665, 76.2438],
        [9.9674, 76.2435],
    ],
    "WATER_FORT_KOCHI_BUS_MATTANCHERRY_BAZAAR": [
        [9.9674, 76.2435],
        [9.9655, 76.2442],
        [9.9610, 76.2510],
        [9.9550, 76.2588],
    ],
    # Banerji Road (Kaloor Metro to High Court Junction)
    "METRO_KALOOR_BUS_HIGH_COURT_JN": [
        [9.9912, 76.2934],
        [9.9895, 76.2890],
        [9.9880, 76.2863],
        [9.9845, 76.2800],
        [9.9822, 76.2755],
    ],
    "BUS_HIGH_COURT_JN_BUS_MARINE_DRIVE": [
        [9.9822, 76.2755],
        [9.9805, 76.2752],
        [9.9790, 76.2750],
    ],
    "BUS_MARINE_DRIVE_BUS_MENAKA": [
        [9.9790, 76.2750],
        [9.9775, 76.2765],
        [9.9768, 76.2782],
    ],
    "METRO_MG_ROAD_BUS_MENAKA": [
        [9.9803, 76.2818],
        [9.9785, 76.2800],
        [9.9768, 76.2782],
    ],
    "METRO_MAHARAJAS_BUS_MENAKA": [
        [9.9723, 76.2838],
        [9.9735, 76.2800],
        [9.9768, 76.2782],
    ],
    "METRO_MG_ROAD_WATER_HIGH_COURT": [
        [9.9803, 76.2818],
        [9.9815, 76.2770],
        [9.9839, 76.2736],
    ],
    "METRO_MAHARAJAS_WATER_HIGH_COURT": [
        [9.9723, 76.2838],
        [9.9735, 76.2800],
        [9.9780, 76.2775],
        [9.9822, 76.2755],
        [9.9839, 76.2736],
    ],
    "METRO_ERNAKULAM_SOUTH_WATER_HIGH_COURT": [
        [9.9676, 76.2882],
        [9.9723, 76.2838],
        [9.9780, 76.2775],
        [9.9839, 76.2736],
    ],
    "BUS_HIGH_COURT_JN_WATER_HIGH_COURT": [
        [9.9822, 76.2755],
        [9.9830, 76.2745],
        [9.9839, 76.2736],
    ],
    # Vyttila Hub to Kakkanad Civil & Infopark along Bypass and Civil Station Road
    "BUS_VYTTILA_HUB_BAY1_BUS_KAKKANAD_CIVIL": [
        [9.9668, 76.3188],
        [9.9780, 76.3240],
        [9.9950, 76.3150],
        [10.0076, 76.3005],
        [10.0120, 76.3200],
        [10.0150, 76.3350],
        [10.0185, 76.3475],
    ],
    "METRO_VYTTILA_BUS_KAKKANAD_CIVIL": [
        [9.9671, 76.3197],
        [9.9780, 76.3240],
        [9.9950, 76.3150],
        [10.0076, 76.3005],
        [10.0120, 76.3200],
        [10.0150, 76.3350],
        [10.0185, 76.3475],
    ],
    "BUS_KAKKANAD_CIVIL_BUS_INFOPARK_EXPRESS": [
        [10.0185, 76.3475],
        [10.0150, 76.3530],
        [10.0120, 76.3580],
        [10.0102, 76.3621],
    ],
    # Edappally to Amrita Hospital along Ponekkara Rd
    "METRO_EDAPPALLY_BUS_EDAPPALLY_TOLL": [
        [10.0253, 76.3082],
        [10.0245, 76.3095],
    ],
    "BUS_EDAPPALLY_TOLL_BUS_AMRITA_HOSPITAL": [
        [10.0245, 76.3095],
        [10.0300, 76.3020],
        [10.0345, 76.2952],
    ],
    "METRO_EDAPPALLY_BUS_AMRITA_HOSPITAL": [
        [10.0253, 76.3082],
        [10.0300, 76.3020],
        [10.0345, 76.2952],
    ],
    "METRO_ALUVA_BUS_ALUVA_STAND": [
        [10.1098, 76.3571],
        [10.1090, 76.3565],
        [10.1085, 76.3562],
    ],
    "METRO_VYTTILA_WATER_VYTTILA": [
        [9.9671, 76.3197],
        [9.9668, 76.3205],
        [9.9665, 76.3210],
    ],
    "METRO_VYTTILA_BUS_VYTTILA_HUB_BAY1": [
        [9.9671, 76.3197],
        [9.9668, 76.3188],
    ],
    "METRO_ERNAKULAM_SOUTH_WATER_WILLINGDON": [
        [9.9676, 76.2882],
        [9.9670, 76.2840],
        [9.9540, 76.2910],
        [9.9542, 76.2730],
    ],
    # Water Metro Navigation Channels
    "WATER_HIGH_COURT_WATER_FORT_KOCHI": [
        [9.9839, 76.2736],
        [9.9780, 76.2660],
        [9.9680, 76.2580],
        [9.9674, 76.2435],
    ],
    "WATER_HIGH_COURT_WATER_VYPIN": [
        [9.9839, 76.2736],
        [9.9855, 76.2620],
        [9.9877, 76.2421],
    ],
    "WATER_HIGH_COURT_WATER_BOLGATTY": [
        [9.9839, 76.2736],
        [9.9818, 76.2652],
    ],
    "WATER_VYTTILA_WATER_KAKKANAD": [
        [9.9665, 76.3210],
        [9.9750, 76.3280],
        [9.9850, 76.3380],
        [9.9980, 76.3530],
        [10.0072, 76.3644],
    ],
    "WATER_SOUTH_CHITTOOR_WATER_CHERANALLOOR": [
        [10.0315, 76.2662],
        [10.0420, 76.2720],
        [10.0528, 76.2798],
    ],
    "WATER_CHERANALLOOR_WATER_ELOOR": [
        [10.0528, 76.2798],
        [10.0630, 76.2890],
        [10.0732, 76.2985],
    ],
    "WATER_FORT_KOCHI_WATER_MATTANCHERRY": [
        [9.9674, 76.2435],
        [9.9620, 76.2510],
        [9.9568, 76.2573],
    ],
    "WATER_MATTANCHERRY_WATER_WILLINGDON": [
        [9.9568, 76.2573],
        [9.9555, 76.2650],
        [9.9542, 76.2730],
    ],
    "WATER_HIGH_COURT_WATER_SOUTH_CHITTOOR": [
        [9.9839, 76.2736],
        [10.0050, 76.2700],
        [10.0315, 76.2662],
    ]
}


def get_corridor_geometry(u: str, v: str, u_lat: float, u_lon: float, v_lat: float, v_lon: float) -> List[List[float]]:
    """Retrieve precise road or navigation channel geometry between two nodes."""
    k1 = f"{u}_{v}"
    k2 = f"{v}_{u}"
    if k1 in ROAD_AND_WATER_CORRIDORS:
        return [list(p) for p in ROAD_AND_WATER_CORRIDORS[k1]]
    elif k2 in ROAD_AND_WATER_CORRIDORS:
        return [list(p) for p in reversed(ROAD_AND_WATER_CORRIDORS[k2])]
    return [[u_lat, u_lon], [v_lat, v_lon]]


class MultimodalGraph:
    """Manages the Kochi multimodal transportation graph in NetworkX."""

    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.stations_dict: Dict[str, Dict[str, Any]] = {}
        self._build_graph()

    def _build_graph(self):
        """Populate nodes and multimodal edges."""
        # 1. Add Metro nodes
        for st in METRO_STATIONS:
            self.graph.add_node(
                st["id"],
                name=st["name"],
                lat=st["lat"],
                lon=st["lon"],
                mode="metro",
                line="Blue Line",
                is_terminal=st.get("is_terminal", False)
            )
            self.stations_dict[st["id"]] = self.graph.nodes[st["id"]]

        # 2. Add Water Metro nodes
        for wm in WATER_METRO_TERMINALS:
            self.graph.add_node(
                wm["id"],
                name=wm["name"],
                lat=wm["lat"],
                lon=wm["lon"],
                mode="water_metro",
                line="Water Metro",
                is_terminal=wm.get("is_terminal", False)
            )
            self.stations_dict[wm["id"]] = self.graph.nodes[wm["id"]]

        # 3. Add Bus stops
        for bs in BUS_STOPS:
            self.graph.add_node(
                bs["id"],
                name=bs["name"],
                lat=bs["lat"],
                lon=bs["lon"],
                mode="feeder_bus",
                line="Feeder Network",
                is_terminal=False
            )
            self.stations_dict[bs["id"]] = self.graph.nodes[bs["id"]]

        # 4. Connect Kochi Metro Line sequentially (bidirectional)
        for i in range(len(METRO_STATIONS) - 1):
            s1 = METRO_STATIONS[i]
            s2 = METRO_STATIONS[i + 1]
            dist = haversine_distance(s1["lat"], s1["lon"], s2["lat"], s2["lon"])
            travel_time = round(max(1.5, (dist / 34.0) * 60), 1)

            edge_data = {
                "mode": "metro",
                "line": "Kochi Metro Line 1",
                "distance_km": round(dist, 2),
                "base_time_min": travel_time,
                "fare": 5.0,
                "frequency_min": 7,
                "co2_g_per_km": 14.0,
                "color": "#0ea5e9",
                "geometry": [[s1["lat"], s1["lon"]], [s2["lat"], s2["lon"]]]
            }
            self.graph.add_edge(s1["id"], s2["id"], key="metro", **edge_data)
            self.graph.add_edge(s2["id"], s1["id"], key="metro", **edge_data)

        # 5. Connect Water Metro Routes
        water_routes = [
            ("WATER_HIGH_COURT", "WATER_VYPIN", 3.8, 10.0, 20.0, "High Court - Vypin"),
            ("WATER_HIGH_COURT", "WATER_BOLGATTY", 1.4, 6.0, 20.0, "High Court - Bolgatty"),
            ("WATER_HIGH_COURT", "WATER_FORT_KOCHI", 4.3, 18.0, 30.0, "High Court - Fort Kochi"),
            ("WATER_HIGH_COURT", "WATER_SOUTH_CHITTOOR", 6.8, 22.0, 35.0, "High Court - South Chittoor"),
            ("WATER_SOUTH_CHITTOOR", "WATER_CHERANALLOOR", 2.6, 11.0, 20.0, "South Chittoor - Cheranalloor"),
            ("WATER_CHERANALLOOR", "WATER_ELOOR", 2.8, 12.0, 20.0, "Cheranalloor - Eloor"),
            ("WATER_FORT_KOCHI", "WATER_MATTANCHERRY", 1.9, 8.0, 20.0, "Fort Kochi - Mattancherry"),
            ("WATER_MATTANCHERRY", "WATER_WILLINGDON", 2.2, 9.0, 20.0, "Mattancherry - Willingdon"),
            ("WATER_VYTTILA", "WATER_KAKKANAD", 9.4, 35.0, 30.0, "Vyttila - Kakkanad"),
        ]

        for u, v, dist, t_min, fare, rname in water_routes:
            u_n = self.graph.nodes[u]
            v_n = self.graph.nodes[v]
            geom = get_corridor_geometry(u, v, u_n["lat"], u_n["lon"], v_n["lat"], v_n["lon"])
            w_edge = {
                "mode": "water_metro",
                "line": rname,
                "distance_km": dist,
                "base_time_min": t_min,
                "fare": fare,
                "frequency_min": 15,
                "co2_g_per_km": 18.0,
                "color": "#0284c7",
                "geometry": geom
            }
            self.graph.add_edge(u, v, key="water_metro", **w_edge)
            self.graph.add_edge(v, u, key="water_metro", **w_edge)

        # 6. Connect Feeder Bus Routes
        bus_routes = [
            ("METRO_ALUVA", "BUS_ALUVA_STAND", 0.3, 2.0, 10.0, "Aluva Hub Shuttle"),
            ("METRO_EDAPPALLY", "BUS_EDAPPALLY_TOLL", 0.4, 3.0, 10.0, "Edappally Feeder"),
            ("BUS_EDAPPALLY_TOLL", "BUS_AMRITA_HOSPITAL", 1.8, 8.0, 15.0, "Amrita Hospital Express"),
            ("METRO_KALOOR", "BUS_HIGH_COURT_JN", 2.6, 12.0, 15.0, "City Bus Line 4"),
            ("BUS_HIGH_COURT_JN", "BUS_MARINE_DRIVE", 0.5, 3.0, 10.0, "Marine Drive Shuttle"),
            ("BUS_MARINE_DRIVE", "BUS_MENAKA", 0.4, 2.0, 10.0, "Menaka Feeder"),
            ("METRO_MG_ROAD", "BUS_MENAKA", 0.6, 4.0, 10.0, "MG Road - Menaka Connector"),
            ("BUS_HIGH_COURT_JN", "WATER_HIGH_COURT", 0.3, 2.0, 0.0, "High Court Jetty Link"),
            ("BUS_FORT_KOCHI_STAND", "WATER_FORT_KOCHI", 0.4, 3.0, 0.0, "Fort Kochi Jetty Shuttle"),
            ("BUS_FORT_KOCHI_STAND", "BUS_MATTANCHERRY_BAZAAR", 1.8, 8.0, 15.0, "Heritage Feeder 1"),
            ("BUS_MATTANCHERRY_BAZAAR", "BUS_THOPPUMPADY", 2.1, 9.0, 15.0, "Harbor Feeder"),
            ("BUS_THOPPUMPADY", "METRO_ERNAKULAM_SOUTH", 5.2, 22.0, 25.0, "West Kochi - City Feeder"),
            ("METRO_VYTTILA", "BUS_VYTTILA_HUB_BAY1", 0.2, 2.0, 0.0, "Vyttila Hub Internal"),
            ("BUS_VYTTILA_HUB_BAY1", "BUS_KAKKANAD_CIVIL", 6.8, 20.0, 25.0, "Infopark Feeder Line 1"),
            ("BUS_KAKKANAD_CIVIL", "BUS_INFOPARK_EXPRESS", 1.9, 7.0, 15.0, "Infopark Feeder Line 2"),
        ]

        for u, v, dist, t_min, fare, rname in bus_routes:
            u_n = self.graph.nodes[u]
            v_n = self.graph.nodes[v]
            geom = get_corridor_geometry(u, v, u_n["lat"], u_n["lon"], v_n["lat"], v_n["lon"])
            b_edge = {
                "mode": "feeder_bus",
                "line": rname,
                "distance_km": dist,
                "base_time_min": t_min,
                "fare": fare,
                "frequency_min": 10,
                "co2_g_per_km": 68.0,
                "color": "#f97316",
                "geometry": geom
            }
            self.graph.add_edge(u, v, key="feeder_bus", **b_edge)
            self.graph.add_edge(v, u, key="feeder_bus", **b_edge)

        # 7. Add Dedicated Intermodal Transfer Walks
        transfers = [
            ("METRO_VYTTILA", "WATER_VYTTILA", 0.25, 3.2, 0.0, "Mobility Hub Skywalk Walk"),
            ("METRO_MG_ROAD", "WATER_HIGH_COURT", 1.1, 14.0, 0.0, "MG Road to Jetty Walk"),
            ("METRO_MAHARAJAS", "BUS_MENAKA", 0.7, 8.5, 0.0, "Maharajas to Menaka Walk"),
            ("METRO_ERNAKULAM_SOUTH", "WATER_WILLINGDON", 3.1, 38.0, 0.0, "South to Willingdon Walk"),
            ("WATER_FORT_KOCHI", "BUS_FORT_KOCHI_STAND", 0.35, 4.2, 0.0, "Fort Kochi Jetty to Bus Stand"),
            ("METRO_EDAPPALLY", "BUS_EDAPPALLY_TOLL", 0.3, 3.5, 0.0, "Edappally Metro to Toll Walk"),
            ("METRO_ALUVA", "BUS_ALUVA_STAND", 0.25, 3.0, 0.0, "Aluva Metro to Bus Stand Walk"),
        ]

        for u, v, dist, t_min, fare, tname in transfers:
            u_n = self.graph.nodes[u]
            v_n = self.graph.nodes[v]
            geom = get_corridor_geometry(u, v, u_n["lat"], u_n["lon"], v_n["lat"], v_n["lon"])
            w_edge = {
                "mode": "walking",
                "line": tname,
                "distance_km": dist,
                "base_time_min": t_min,
                "fare": 0.0,
                "frequency_min": 0,
                "co2_g_per_km": 0.0,
                "color": "#10b981",
                "geometry": geom
            }
            self.graph.add_edge(u, v, key="walking", **w_edge)
            self.graph.add_edge(v, u, key="walking", **w_edge)

        # 8. Add Auto-rickshaw First/Last Mile Options
        auto_links = [
            ("METRO_MG_ROAD", "WATER_HIGH_COURT", 1.1, 4.0, 40.0, "MG Road - High Court Auto"),
            ("METRO_MAHARAJAS", "WATER_HIGH_COURT", 1.6, 5.5, 45.0, "Maharajas - High Court Auto"),
            ("METRO_ERNAKULAM_SOUTH", "WATER_HIGH_COURT", 2.4, 8.0, 55.0, "South Station - High Court Auto"),
            ("BUS_THOPPUMPADY", "WATER_FORT_KOCHI", 3.8, 11.0, 75.0, "Thoppumpady - Fort Kochi Auto"),
            ("METRO_EDAPPALLY", "BUS_AMRITA_HOSPITAL", 1.9, 6.0, 45.0, "Edappally - Amrita Auto"),
            ("METRO_VYTTILA", "BUS_KAKKANAD_CIVIL", 6.8, 16.0, 120.0, "Vyttila - Kakkanad Auto"),
            ("WATER_FORT_KOCHI", "BUS_MATTANCHERRY_BAZAAR", 2.2, 7.0, 50.0, "Fort Kochi - Mattancherry Auto"),
        ]

        for u, v, dist, t_min, fare, aname in auto_links:
            u_n = self.graph.nodes[u]
            v_n = self.graph.nodes[v]
            geom = get_corridor_geometry(u, v, u_n["lat"], u_n["lon"], v_n["lat"], v_n["lon"])
            a_edge = {
                "mode": "auto",
                "line": aname,
                "distance_km": dist,
                "base_time_min": t_min,
                "fare": fare,
                "frequency_min": 2,
                "co2_g_per_km": 85.0,
                "color": "#eab308",
                "geometry": geom
            }
            self.graph.add_edge(u, v, key="auto", **a_edge)
            self.graph.add_edge(v, u, key="auto", **a_edge)


    def get_all_stations(self) -> List[Dict[str, Any]]:
        """Return list of all stations/terminals with metadata."""
        stations = []
        for nid, data in self.graph.nodes(data=True):
            stations.append({
                "id": nid,
                "name": data.get("name"),
                "lat": data.get("lat"),
                "lon": data.get("lon"),
                "mode": data.get("mode"),
                "line": data.get("line"),
                "is_terminal": data.get("is_terminal", False)
            })
        return stations

    def find_nearest_node(self, lat: float, lon: float, mode: Optional[str] = None) -> str:
        """Find the nearest graph node to given coordinates, optionally filtered by mode."""
        best_id = None
        best_dist = float("inf")
        for nid, data in self.graph.nodes(data=True):
            if mode and data.get("mode") != mode:
                continue
            d = haversine_distance(lat, lon, data["lat"], data["lon"])
            if d < best_dist:
                best_dist = d
                best_id = nid
        return best_id
