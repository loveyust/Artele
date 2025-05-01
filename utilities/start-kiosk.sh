# Wait for network connection
until ping -c1 google.com >/dev/null 2>&1; do sleep 2; done

# Start the application server (adjust the path to your app location)
cd /path/to/your/artele/app
npm start &

# Wait for server to be ready (adjust time if needed)
sleep 10

# Start Chromium in kiosk mode
chromium-browser --noerrdialogs \
                --disable-infobars \
                --kiosk \
                --disable-translate \
                --no-first-run \
                --fast \
                --fast-start \
                --disable-features=TranslateUI \
                --disable-pinch \
                --overscroll-history-navigation=0 \
                --disable-features=TouchpadOverscrollHistoryNavigation \
                "http://localhost:3000" # Adjust port if different


# Make this executable 
# chmod +x /path/to/utilities/start-kiosk.sh