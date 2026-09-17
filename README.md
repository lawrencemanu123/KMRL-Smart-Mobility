# KMLR – AI-Enabled Unified Multimodal Urban Mobility Platform for the Kochi Metropolitan Region

A production-grade, full-stack intelligent transportation web platform specifically engineered for the Kochi Metropolitan Region. It seamlessly unites **Kochi Metro**, **Kochi Water Metro**, **Feeder Buses**, **Auto-rickshaws (last-mile)**, **Walking**, and **Cycling** into a unified graph routing engine powered by Scikit-Learn predictive models, dynamic disruption rerouting, and interactive GIS mapping.

---

## 🌟 Key Capabilities

1. **Unified Multimodal Transit Graph**:
   - Integrates all **25 Kochi Metro stations** (Blue Line: Aluva to Thripunithura).
   - Integrates all **11 Kochi Water Metro terminals** (High Court, Vypin, Bolgatty, Fort Kochi, South Chittoor, Cheranalloor, Eloor, Mattancherry, Willingdon Island, Kakkanad, Vyttila Jetty).
   - Connects feeder bus networks, designated auto-rickshaw stands, and pedestrian skywalks.
   - *Note: Ride-sharing and car-pooling are explicitly excluded.*

2. **Trained Machine Learning Models**:
   - **Travel Time Predictor**: Gradient Boosting Regressor ($R^2 = 0.9945$, $\text{MAE} = 0.55\text{ min}$).
   - **Service Delay Predictor**: Gradient Boosting Regressor ($R^2 = 0.9853$, $\text{MAE} = 0.33\text{ min}$).
   - **Platform Waiting Time Predictor**: Random Forest Regressor ($R^2 = 0.9424$, $\text{MAE} = 0.57\text{ min}$).
   - **Explainable AI (XAI)**: Generates human-readable badges explaining why routes are recommended.

3. **Dynamic Disruption Simulation & Rerouting**:
   - Evaluates real-time channel traffic and weather conditions.
   - Automatically detects delays (e.g. Water Metro 12-min delay) and alerts commuters with time-saving alternatives.

4. **Interactive GIS Dashboard (React + Leaflet)**:
   - Color-coded transit layers and live departure popups.
   - Multi-leg polyline rendering with transfer pins.
   - Real-time delay monitoring board and ML inspection analytics.

---

## 🏗️ System Architecture

```
                                  KMLR Architecture
                                  
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                           React + TypeScript Frontend                       │
  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐ │
  │  │Journey Planner│ │ Interactive   │ │ Live Status & │ │ ML Analytics &  │ │
  │  │& Preferences  │ │  Leaflet Map  │ │ Disruption Sim│ │ XAI Playground  │ │
  │  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └────────┬────────┘ │
  └──────────┼─────────────────┼─────────────────┼──────────────────┼──────────┘
             │                 │ REST / JSON     │                  │
  ┌──────────▼─────────────────▼─────────────────▼──────────────────▼──────────┐
  │                              FastAPI Backend                                │
  │  ┌────────────────────────┐ ┌────────────────────────┐ ┌─────────────────┐  │
  │  │ Multimodal Graph Engine│ │ ML Prediction Service  │ │ Real-Time Sim   │  │
  │  │ (NetworkX + Cost Func) │ │ (Travel/Delay/Wait/XAI)│ │ & Dynamic Reroute│ │
  │  └───────────┬────────────┘ └───────────┬────────────┘ └────────┬────────┘  │
  │  ┌───────────▼────────────┐ ┌───────────▼────────────┐          │           │
  │  │ Auth & User Prefs (JWT)│ │ Fares & Transfer Opt.  │ ◄────────┘           │
  │  └────────────────────────┘ └────────────────────────┘                      │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ SQLAlchemy ORM
  ┌──────────────────────────────────────▼──────────────────────────────────────┐
  │                    Database Layer & Serialized Models                       │
  │  • SQLite (Default plug-and-play) / PostgreSQL + PostGIS                     │
  │  • Serialized Model Pipelines: travel_time, delay, waiting_time (.joblib)   │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- Python 3.11 or 3.12
- Node.js v20+ and npm

### 1. Start the Backend API Server
```powershell
cd backend

# 1. Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Train models and seed transit network (Already pre-trained and saved in models/)
python scripts/generate_datasets.py
python scripts/train_models.py
python scripts/seed_network.py

# 4. Start FastAPI server (Runs on port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Start the React Frontend
```powershell
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server (Runs on port 5173)
npm run dev
```
Open your browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 🎯 Step-by-Step Project Evaluation Demo Flow

To demonstrate the complete platform during a final-year evaluation:

1. **Open KMLR in Browser**: Navigate to `http://localhost:5173/`.
2. **Observe Origin & Destination**: By default, the flagship evaluation journey is pre-loaded:
   - **Origin**: `Aluva (Metro)`
   - **Destination**: `Fort Kochi (Water Metro)`
3. **Select Preference**: Click **"Fastest"** and press **"Find Optimal Multimodal Routes"**.
4. **Inspect Route Cards**:
   - **Route 1**: Kochi Metro (Aluva to MG Road) $\rightarrow$ Auto $\rightarrow$ Water Metro (High Court to Fort Kochi).
   - Total Travel Time: **~53 minutes**, Fare: **~₹114**, Transfers: **2**.
   - Review the Explainable AI badges: *"Scenic & Zero Road Congestion via Water Metro"*, *"Rapid Transit"*.
5. **Inspect the Map**: Click on Route 1 to view the color-coded transit track on the Leaflet map.
6. **Simulate a Disruption**:
   - In the top Disruption Simulator panel, click **"⚠️ Simulate Water Metro Delay (+12m)"**.
   - Notice the amber **AI Dynamic Reroute Alert** appears:
     > *"Water Metro service is delayed by approximately 12 minutes due to channel congestion. An alternative route via feeder bus is estimated to save 8 minutes."*
7. **Switch to Alternative Route**: Click **"Switch to Alternative Route"** to instantly update the itinerary to the bypass corridor (via West Kochi City Feeder).
8. **Explore AI & ML Analytics**:
   - Click the **"AI & ML Analytics"** tab in the navbar.
   - Inspect the $R^2$ scores, MAE/RMSE tables, and feature importance bar charts.
   - Use the **Live Prediction Playground** to test real-time inference with custom distances and weather conditions.
9. **Explore Operations Dashboard**:
   - Click the **"Admin"** tab to view commuter modal split percentages, daily journeys, and carbon offset metrics.

---

## 🐳 Docker Deployment

The entire system can be launched in Docker containers:
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL / PostGIS: `localhost:5432`

---

## 🧪 Automated Testing
Run the backend test suite:
```powershell
cd backend
.\.venv\Scripts\pytest tests/ -v
```
Validates routing algorithms, ML model accuracy, transfer optimization, and API endpoints.
