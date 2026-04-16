Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot "server\.env"
$networkName = "careline-net"

$containers = @(
  @{
    Name  = "careline-auth"
    Image = "careline360/auth-service:latest"
    Args  = @(
      "--network", $networkName,
      "--env", "PORT=3001",
      "--env", "MONGO_URI=mongodb://careline-mongo:27017/careline_auth_db",
      "--env", "MONGODB_URI=mongodb://careline-mongo:27017/careline_auth_db",
      "--env", "RABBITMQ_URL=amqp://careline-rabbit:5672",
      "--env", "RABBITMQ_URI=amqp://careline-rabbit:5672",
      "-p", "3001:3001"
    )
  },
  @{
    Name  = "careline-patient"
    Image = "careline360/patient-service:latest"
    Args  = @(
      "--network", $networkName,
      "--env", "PORT=5002",
      "--env", "MONGO_URI=mongodb://careline-mongo:27017/careline_patient_db",
      "--env", "MONGODB_URI=mongodb://careline-mongo:27017/careline_patient_db",
      "--env", "RABBITMQ_URL=amqp://careline-rabbit:5672",
      "--env", "RABBITMQ_URI=amqp://careline-rabbit:5672",
      "-p", "5002:5002"
    )
  },
  @{
    Name  = "careline-doctor"
    Image = "careline360/doctor-service:latest"
    Args  = @(
      "--network", $networkName,
      "--env", "PORT=5003",
      "--env", "MONGO_URI=mongodb://careline-mongo:27017/careline_doctor_db",
      "--env", "MONGODB_URI=mongodb://careline-mongo:27017/careline_doctor_db",
      "--env", "RABBITMQ_URL=amqp://careline-rabbit:5672",
      "--env", "RABBITMQ_URI=amqp://careline-rabbit:5672",
      "-p", "5003:5003"
    )
  },
  @{
    Name  = "careline-appointment"
    Image = "careline360/appointment-service:latest"
    Args  = @(
      "--network", $networkName,
      "--env", "PORT=5004",
      "--env", "MONGO_URI=mongodb://careline-mongo:27017/careline_appointment_db",
      "--env", "MONGODB_URI=mongodb://careline-mongo:27017/careline_appointment_db",
      "--env", "RABBITMQ_URL=amqp://careline-rabbit:5672",
      "--env", "RABBITMQ_URI=amqp://careline-rabbit:5672",
      "-p", "5004:5004"
    )
  },
  @{
    Name  = "careline-admin"
    Image = "careline360/admin-service:latest"
    Args  = @(
      "--network", $networkName,
      "--env", "PORT=5005",
      "--env", "MONGO_URI=mongodb://careline-mongo:27017/careline_admin_db",
      "--env", "MONGODB_URI=mongodb://careline-mongo:27017/careline_admin_db",
      "--env", "RABBITMQ_URL=amqp://careline-rabbit:5672",
      "--env", "RABBITMQ_URI=amqp://careline-rabbit:5672",
      "-p", "5005:5005"
    )
  },
  @{
    Name  = "careline-emergency"
    Image = "careline360/emergency-service:latest"
    Args  = @(
      "--network", $networkName,
      "--env", "PORT=5006",
      "--env", "MONGO_URI=mongodb://careline-mongo:27017/careline_emergency_db",
      "--env", "MONGODB_URI=mongodb://careline-mongo:27017/careline_emergency_db",
      "--env", "RABBITMQ_URL=amqp://careline-rabbit:5672",
      "--env", "RABBITMQ_URI=amqp://careline-rabbit:5672",
      "-p", "5006:5006"
    )
  },
  @{
    Name  = "careline-api-gateway"
    Image = "careline360/api-gateway:latest"
    Args  = @(
      "--network", $networkName,
      "--env", "PORT=1111",
      "--env", "AUTH_SERVICE_URL=http://careline-auth:3001",
      "--env", "PATIENT_SERVICE_URL=http://careline-patient:5002",
      "--env", "DOCTOR_SERVICE_URL=http://careline-doctor:5003",
      "--env", "APPOINTMENT_SERVICE_URL=http://careline-appointment:5004",
      "--env", "ADMIN_SERVICE_URL=http://careline-admin:5005",
      "--env", "EMERGENCY_SERVICE_URL=http://careline-emergency:5006",
      "-p", "1111:1111",
      "-p", "31111:1111"
    )
  }
)

function Assert-DockerAvailable {
  try {
    & docker version | Out-Null
  } catch {
    throw "Docker is not available. Start Docker Desktop and try again."
  }
}

function Ensure-Network {
  $exists = (& docker network ls --format "{{.Name}}") -contains $networkName
  if (-not $exists) {
    Write-Host "Creating Docker network: $networkName"
    & docker network create $networkName | Out-Null
  }
}

function Ensure-ContainerRunning {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Image,
    [Parameter(Mandatory = $true)][string[]]$Args,
    [switch]$UseEnvFile
  )

  $allContainers = & docker ps -a --format "{{.Names}}"
  if ($allContainers -contains $Name) {
    $running = (& docker ps --format "{{.Names}}") -contains $Name
    if ($running) {
      Write-Host "Already running: $Name"
      return
    }

    Write-Host "Starting existing container: $Name"
    & docker start $Name | Out-Null
    return
  }

  Write-Host "Creating and starting: $Name"
  $runArgs = @("run", "-d", "--name", $Name)

  if ($UseEnvFile -and (Test-Path $envFile)) {
    $runArgs += @("--env-file", $envFile)
  }

  $runArgs += $Args
  $runArgs += $Image

  & docker @runArgs | Out-Null
}

function Assert-ImagePresent {
  param([Parameter(Mandatory = $true)][string]$Image)

  $imageFound = (& docker images --format "{{.Repository}}:{{.Tag}}") -contains $Image
  if (-not $imageFound) {
    throw "Missing image '$Image'. Build all service images first."
  }
}

Assert-DockerAvailable
Ensure-Network

if (-not (Test-Path $envFile)) {
  Write-Warning "server/.env not found at '$envFile'. Services may fail without required secrets."
}

# Infrastructure
Ensure-ContainerRunning -Name "careline-mongo" -Image "mongo:7" -Args @(
  "--network", $networkName,
  "-p", "27017:27017"
)

Ensure-ContainerRunning -Name "careline-rabbit" -Image "rabbitmq:3-management" -Args @(
  "--network", $networkName,
  "-p", "5672:5672",
  "-p", "15672:15672"
)

# Application services
foreach ($svc in $containers) {
  Assert-ImagePresent -Image $svc.Image
  Ensure-ContainerRunning -Name $svc.Name -Image $svc.Image -Args $svc.Args -UseEnvFile
}

Write-Host ""
Write-Host "CareLine360 containers are running."
Write-Host "API gateway health: http://localhost:1111/health"
Write-Host "RabbitMQ UI: http://localhost:15672"
Write-Host ""
Write-Host "Use scripts/stop-containers.ps1 to stop and remove containers."
