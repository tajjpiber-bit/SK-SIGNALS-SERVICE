/**
 * TradingView Alert Bridge for Free Accounts
 * 
 * Instructions:
 * 1. Open your TradingView chart with the indicator.
 * 2. Set up a standard alert to show a "Popup" (pop-up window) when triggered.
 * 3. Press F12 (or right-click and select "Inspect") to open Chrome DevTools.
 * 4. Go to the "Console" tab.
 * 5. Paste this entire code and press Enter.
 * 
 * How it works:
 * This script runs inside your browser tab. Whenever TradingView shows a free pop-up alert,
 * the script intercepts it, extracts the signal data, sends it to your local dashboard,
 * and automatically closes the pop-up.
 */

(function() {
    console.log("%c🚀 TradingView Alert Bridge is ACTIVE!", "color: #10b981; font-size: 16px; font-weight: bold;");
    console.log("Waiting for popup alerts to forward to your dashboard...");

    const LOCAL_WEBHOOK_URL = 'http://localhost:8080/webhook';

    // Watch for new popup elements in the page DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                // TradingView popups usually have a class starting with 'dialog-' or 'popup-'
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const textContent = node.textContent || "";
                    
                    // Check if this popup is a TradingView alert by looking for our JSON format
                    if (textContent.includes('"symbol"') && textContent.includes('"price"')) {
                        console.log("%c🔥 Alert Detected in Popup! Processing...", "color: #3b82f6; font-weight: bold;");
                        
                        try {
                            // Extract JSON string from popup text
                            const jsonMatch = textContent.match(/\{[\s\S]*?\}/);
                            if (jsonMatch) {
                                const alertData = JSON.parse(jsonMatch[0]);
                                
                                // Forward alert data to local Express server
                                fetch(LOCAL_WEBHOOK_URL, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(alertData)
                                })
                                .then(res => res.json())
                                .then(data => {
                                    console.log("%c✅ Successfully forwarded to dashboard!", "color: #10b981;");
                                })
                                .catch(err => {
                                    console.error("❌ Failed to send to local dashboard server:", err);
                                });

                                // Find and click the close button on the popup to keep the screen clean
                                const closeBtn = node.querySelector('[class*="close"], [class*="button"]');
                                if (closeBtn) {
                                    closeBtn.click();
                                    console.log("Popup automatically cleared.");
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing alert JSON from popup:", e);
                        }
                    }
                }
            });
        });
    });

    // Start observing body element for children additions
    observer.observe(document.body, { childList: true, subtree: true });
})();
