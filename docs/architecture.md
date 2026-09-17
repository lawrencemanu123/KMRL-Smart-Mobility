# KMLR System Architecture

## Overview
**KMLR (Kochi Metropolitan Unified Multimodal Mobility Platform)** is designed to provide integrated passenger journey planning, AI-based travel/delay forecasting, and dynamic disruption rerouting across six transit modes:
1. **Kochi Metro** (25 stations on Line 1 from Aluva to Thripunithura)
2. **Kochi Water Metro** (11 battery-electric hybrid catamaran terminals)
3. **Feeder Buses** (Connecting key metro interchanges to educational/IT hubs)
4. **Auto-rickshaws** (First/last-mile feeder connections)
5. **Walking** (Safe, designated pedestrian skywalks & transfer links)
6. **Cycling** (Micro-mobility hubs)

*Note: In accordance with project requirements, private ride-sharing and car-pooling are explicitly excluded.*

---

## Logical Architecture Diagram

```
                              PASSENGER / COMMUTER
                                       │
                                       ▼
                     REACT + TYPESCRIPT FRONTEND (VITE)
       ┌───────────────────────────────────────────────────────────────┐
       │  • Leaflet GIS Map with Color-Coded Polylines & Markers       │
       │  • Multimodal Journey Planner with Preference Profiles        │
       │  • Live Disruption Simulation & Dynamic Reroute Alert Banner │
       │  • AI / ML Analytics Inspection & Live Inference Playground   │
       │  • Admin Operations & Modal Split Dashboard                   │
       └───────────────────────────────┬───────────────────────────────┘
                                       │ REST / JSON (Port 8000)
                                       ▼
                             FASTAPI BACKEND CORE
       ┌───────────────────────────────────────────────────────────────┐
       │  • Route Planning & Graph Routing Service (NetworkX)          │
       │  • Machine Learning Predictor Service (Scikit-Learn/XGBoost)  │
       │  • Real-Time Disruption Simulator & Reroute Dispatcher       │
       │  • Transfer Optimization & Connection Feasibility Service     │
       │  • Fare Calculation & Carbon Offset Computation               │
       │  • JWT Authentication & User Mobility Preferences             │
       └───────────────────────────────┬───────────────────────────────┘
                                       │
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
       DATABASE LAYER                                  SERIALIZED ML MODELS
  • SQLite (kmlr.db, zero-setup default)           • travel_time_pipeline.joblib
  • PostgreSQL + PostGIS (Production)              • delay_prediction_pipeline.joblib
  • Stations, Jetties, Lines, User Records         • waiting_time_pipeline.joblib
```

---

## Multimodal Graph Model & Cost Function

The transit network is modeled as a weighted directed multigraph $G = (V, E)$.

### Cost Formulation:
$$\text{Cost} = w_{\text{time}} \cdot T_{\text{travel}} + w_{\text{wait}} \cdot T_{\text{wait}} + w_{\text{fare}} \cdot \text{Fare} + w_{\text{transfer}} \cdot P_{\text{transfer}} + w_{\text{walk}} \cdot T_{\text{walk}} + w_{\text{delay}} \cdot \hat{D} + w_{\text{eco}} \cdot \text{CO}_2$$

Weights adapt to passenger preference:
- **Fastest**: High $w_{\text{time}}$, low $w_{\text{fare}}$
- **Cheapest**: High $w_{\text{fare}}$, moderate $w_{\text{time}}$
- **Min Transfers**: Heavy transfer penalty ($w_{\text{transfer}} = 25.0$)
- **Comfortable**: Heavy penalty on long walking distances ($w_{\text{walk}} = 2.2$)
- **Eco-Friendly**: Minimizes carbon footprint ($w_{\text{eco}} = 1.8$)
