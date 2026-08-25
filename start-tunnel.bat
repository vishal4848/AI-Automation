@echo off
echo ===================================================
echo  AI Automation - Instagram OAuth HTTPS Tunnel
echo ===================================================
echo.
echo Starting secure HTTPS tunnel for backend port 3001...
echo Once started, copy the generated HTTPS URL and set it in:
echo   1. Meta Developer Dashboard (OAuth redirect URIs)
echo   2. ai-automation-backend\.env (META_REDIRECT_URI)
echo.
echo URL format: https://[your-subdomain].loca.lt/api/v1/social/instagram/callback
echo ===================================================
echo.
npx --yes localtunnel --port 3001
pause
