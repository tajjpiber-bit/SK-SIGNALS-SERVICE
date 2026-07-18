# Enable TLS 1.2/1.3 for downloads
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "STARTING TRADING DASHBOARD AUTO-LAUNCHER" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing node servers to free up port 8080
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue

$nodeDir = "$PSScriptRoot\node_portable"
$nodeExe = "$nodeDir\node.exe"

# 1. Check if Node.js portable is installed
if (!(Test-Path $nodeExe)) {
    Write-Host "[INFO] Node.js not found. Downloading portable package (v20)..." -ForegroundColor Yellow
    $zipUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
    $zipFile = "$PSScriptRoot\node.zip"
    
    try {
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile
    } catch {
        Write-Host "[ERROR] Failed to download Node.js. Check your internet connection." -ForegroundColor Red
        Exit
    }
    
    Write-Host "[INFO] Extracting Node.js package..." -ForegroundColor Yellow
    $tempDir = "$PSScriptRoot\node_temp"
    Expand-Archive -Path $zipFile -DestinationPath $tempDir
    Move-Item -Path "$tempDir\node-v20.11.0-win-x64" -Destination $nodeDir
    Remove-Item -Path $zipFile -Force
    Remove-Item -Path $tempDir -Recurse -Force
    Write-Host "[SUCCESS] Portable Node.js installed!" -ForegroundColor Green
} else {
    Write-Host "[SUCCESS] Node.js portable already available." -ForegroundColor Green
}

# 2. Run npm install
Write-Host "[INFO] Installing project dependencies (Express and CORS)..." -ForegroundColor Yellow
$npmCmd = "$nodeDir\npm.cmd"
Start-Process -FilePath $npmCmd -ArgumentList "install" -WorkingDirectory $PSScriptRoot -Wait -NoNewWindow
Write-Host "[SUCCESS] Dependencies verified!" -ForegroundColor Green

# 3. Start local Node.js server
Write-Host "[INFO] Starting signal receiver server..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath $nodeExe -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2
Write-Host "[SUCCESS] Server is running in the background on port 8080!" -ForegroundColor Green

# 4. Open Dashboard in Browser
Start-Process "http://localhost:8080"

# 5. Download cloudflared if not present
$cloudflaredExe = "$PSScriptRoot\cloudflared.exe"
if (!(Test-Path $cloudflaredExe)) {
    Write-Host "[INFO] Cloudflared not found. Downloading..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflaredExe
        Write-Host "[SUCCESS] Cloudflared downloaded!" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to download cloudflared. Check internet connection." -ForegroundColor Red
        Exit
    }
} else {
    Write-Host "[SUCCESS] Cloudflared already available." -ForegroundColor Green
}

# 6. Start Cloudflare Tunnel with auto-reconnect loop
Write-Host "" 
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  STARTING CLOUDFLARE TUNNEL (ONLINE LINK)" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Your ONLINE link will appear below in a few seconds." -ForegroundColor Green
Write-Host "  Copy the 'trycloudflare.com' link and use it anywhere!" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  [WARNING] DO NOT CLOSE THIS WINDOW!" -ForegroundColor Red
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    Write-Host "[INFO] Connecting to Cloudflare Tunnel..." -ForegroundColor Yellow
    & $cloudflaredExe tunnel --url http://localhost:8080 2>&1 | ForEach-Object {
        Write-Host $_ 
    }
    Write-Host ""
    Write-Host "[WARNING] Cloudflare tunnel disconnected. Reconnecting in 5 seconds..." -ForegroundColor Red
    Start-Sleep -Seconds 5
}
