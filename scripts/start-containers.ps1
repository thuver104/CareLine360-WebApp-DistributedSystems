$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root 'server/.env'
if (-not (Test-Path $envFile)) {
  Write-Error "Missing server/.env. Create it before starting containers."
}

$network = 'careline-net'
$containers = @(
  'auth-service',
  'patient-service',
  'doctor-service',
  'appointment-service',
  'admin-service',
  'emergency-service',
  'api-gateway',
  'careline-api-gateway'
)

# Create network if missing
$existingNetwork = docker network ls --format '{{.Name}}' | Where-Object { $_ -eq $network }
if (-not $existingNetwork) {
  docker network create $network | Out-Null
}

# Remove old app containers to avoid name conflicts
foreach ($name in $containers) {
  cmd /c "docker rm -f $name >nul 2>&1"
}

# Start infra (idempotent)
cmd /c "docker rm -f careline-mongo >nul 2>&1"
cmd /c "docker rm -f careline-rabbit >nul 2>&1"
docker run -d --restart unless-stopped --name careline-mongo --network $network -p 27017:27017 mongo:7 | Out-Null
docker run -d --restart unless-stopped --name careline-rabbit --network $network -p 5672:5672 -p 15672:15672 rabbitmq:3-management | Out-Null

# Give MongoDB/RabbitMQ time to become reachable before services boot.
Start-Sleep -Seconds 8

# Start services
docker run -d --restart unless-stopped --name auth-service --network $network -p 3001:3001 --env-file $envFile -e PORT=3001 -e MONGO_URI=mongodb://careline-mongo:27017/careline_auth_db -e RABBITMQ_URL=amqp://careline-rabbit:5672 careline360/auth-service:latest | Out-Null
docker run -d --restart unless-stopped --name patient-service --network $network -p 5002:5002 --env-file $envFile -e PORT=5002 -e MONGODB_URI=mongodb://careline-mongo:27017/careline_patient_db -e RABBITMQ_URL=amqp://careline-rabbit:5672 careline360/patient-service:latest | Out-Null
docker run -d --restart unless-stopped --name doctor-service --network $network -p 5003:5003 --env-file $envFile -e PORT=5003 -e MONGO_URI=mongodb://careline-mongo:27017/careline_doctor_db -e RABBITMQ_URL=amqp://careline-rabbit:5672 careline360/doctor-service:latest | Out-Null
docker run -d --restart unless-stopped --name appointment-service --network $network -p 5004:5004 --env-file $envFile -e PORT=5004 -e MONGO_URI=mongodb://careline-mongo:27017/careline_appointment_db -e RABBITMQ_URL=amqp://careline-rabbit:5672 -e PATIENT_SERVICE_URL=http://patient-service:5002 -e DOCTOR_SERVICE_URL=http://doctor-service:5003 careline360/appointment-service:latest | Out-Null
docker run -d --restart unless-stopped --name admin-service --network $network -p 5005:5005 --env-file $envFile -e PORT=5005 -e MONGO_URI=mongodb://careline-mongo:27017/careline_admin_db careline360/admin-service:latest | Out-Null
docker run -d --restart unless-stopped --name emergency-service --network $network -p 5006:5006 --env-file $envFile -e PORT=5006 -e MONGO_URI=mongodb://careline-mongo:27017/careline_emergency_db careline360/emergency-service:latest | Out-Null
docker run -d --restart unless-stopped --name api-gateway --network $network -p 1111:1111 -e PORT=1111 -e AUTH_SERVICE_URL=http://auth-service:3001 -e PATIENT_SERVICE_URL=http://patient-service:5002 -e DOCTOR_SERVICE_URL=http://doctor-service:5003 -e APPOINTMENT_SERVICE_URL=http://appointment-service:5004 -e ADMIN_SERVICE_URL=http://admin-service:5005 -e EMERGENCY_SERVICE_URL=http://emergency-service:5006 -e CLIENT_URL=http://localhost:5173 careline360/api-gateway:latest | Out-Null

Start-Sleep -Seconds 5

docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
Write-Host ''
Write-Host 'Health checks:'
try { (Invoke-WebRequest -UseBasicParsing http://localhost:1111/health).StatusCode | Out-Host } catch { Write-Host 'api-gateway: not ready' }
try { (Invoke-WebRequest -UseBasicParsing http://localhost:3001/health).StatusCode | Out-Host } catch { Write-Host 'auth-service: not ready' }
try { (Invoke-WebRequest -UseBasicParsing http://localhost:5002/health/ready).StatusCode | Out-Host } catch { Write-Host 'patient-service: not ready' }
try { (Invoke-WebRequest -UseBasicParsing http://localhost:5003/health).StatusCode | Out-Host } catch { Write-Host 'doctor-service: not ready' }
try { (Invoke-WebRequest -UseBasicParsing http://localhost:5004/health).StatusCode | Out-Host } catch { Write-Host 'appointment-service: not ready' }
try { (Invoke-WebRequest -UseBasicParsing http://localhost:5005/health).StatusCode | Out-Host } catch { Write-Host 'admin-service: not ready' }
try { (Invoke-WebRequest -UseBasicParsing http://localhost:5006/health).StatusCode | Out-Host } catch { Write-Host 'emergency-service: not ready' }
