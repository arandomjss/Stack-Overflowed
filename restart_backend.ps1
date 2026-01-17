# Kill any process using port 5000
$port = 5000
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Killing processes on port $port..."
    foreach ($pid in $processes) {
        Write-Host "  Stopping PID: $pid"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "No processes found on port $port"
}

Write-Host "`nStarting backend server..."
python start_server.py
