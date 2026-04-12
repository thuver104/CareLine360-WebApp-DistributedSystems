$containers = @(
  'api-gateway',
  'careline-api-gateway',
  'auth-service',
  'patient-service',
  'doctor-service',
  'appointment-service',
  'admin-service',
  'emergency-service',
  'careline-rabbit',
  'careline-mongo'
)

foreach ($name in $containers) {
  cmd /c "docker rm -f $name >nul 2>&1"
}

docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
Write-Host 'Stopped CareLine360 containers.'
