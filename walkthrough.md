# Trading Confluence & SMT Dashboard Walkthrough

This document guides you through setting up and running your TradingView Pine Script along with your new Web Dashboard Signal Centers.

---

## 📁 Project Structure

The project has been written to your scratch space:
- **Pine Script Indicator:** `trading_matrix_dashboard.pine`
- **Node.js Webhook Server:** `trading_dashboard/`
- **1-Click Auto-Launcher:** `C:\Users\princ\.gemini\antigravity\scratch\trading_dashboard\click_to_start.bat`
- **Lite Standalone Dashboard:** [trading_dashboard_lite.html](file:///C:/Users/princ/.gemini/antigravity/scratch/trading_dashboard_lite.html)

---

## 📈 Part 1: TradingView Pine Script Configuration

Ensure you are using the updated script. It has been modified to support **Active Rules** (displaying S1-S10 on the dashboard and in the alert payload) and **Timeframe Detection** (indicating which timeframe generated the signal).

### Setting up Alerts on TradingView
1. Click the **Alert** button (bell icon) in TradingView.
2. **Condition:** Select `10-in-1 Strategy Matrix Dashboard & SMT`.
3. **Trigger:** Select **`Any alert() function call`**. *(This sends the full dynamic JSON package).*
4. In the **Message** text area, paste this payload exactly:
   ```json
   {
     "symbol": "{{ticker}}",
     "timeframe": "{{interval}}",
     "direction": "{{plot_2}}",
     "score": "{{plot_0}}",
     "rules": "{{plot_4}}",
     "smt": "{{plot_3}}",
     "price": "{{close}}",
     "image": "{{image}}"
   }
   ```
5. Toggle the **Webhook URL** notification option, and paste the URL from your web server (see below).

---

## 🖥️ Part 2: Desktop Dashboard Options

To make signal tracking seamless, we provided two versions of the Web Dashboard.

### Option A: 1-Click Auto-Launcher (Recommended)
Perfect for live trading. It sets up the server, downloads dependencies, opens the browser, and establishes a secure public tunnel automatically.
1. Open this folder: `C:\Users\princ\.gemini\antigravity\scratch\trading_dashboard\`
2. Double-click the **`click_to_start.bat`** file.
3. A command prompt window will open:
   - It will automatically download a portable version of Node.js (if not already present).
   - It will start the server.
   - It will automatically launch the dashboard in your default browser at `http://localhost:8080/`.
   - It will connect to a secure public tunnel and print your live **Webhook URL** (e.g. `https://xxxx.serveousercontent.com`).
4. Copy the URL from the command prompt, add `/webhook` to the end, and paste it into your TradingView alert settings!

### Option B: Lite Standalone Dashboard
Perfect for quick offline simulation testing.
1. Open this file in your web browser: [trading_dashboard_lite.html](file:///C:/Users/princ/.gemini/antigravity/scratch/trading_dashboard_lite.html)
2. You will see a beautiful dark theme with glassmorphic pair cards and glowing status animations.
3. Click the **"Simulate Strong Signal"** button at the top. It will randomly generate a mockup confluence signal (7/10 to 10/10) with realistic rules (e.g. `S1,S3,S9`), play a premium notification chime, and log it to the live feed.

---

## 📸 Chart Screenshots & SMT Divergence
- **Chart Screenshots:** If you paste the updated JSON message body containing `"image": "{{image}}"` in TradingView, the dashboard will automatically show a **"📸 View"** button next to each signal. Clicking this button opens a premium glassmorphic modal displaying the exact chart layout at the moment the signal triggered!
- **SMT Divergence Check:** In Gold (XAUUSD) signals, SMT divergence check is mandatory and will be displayed in the **SMT Status** column as `Valid SMT` or `Pending SMT`.
