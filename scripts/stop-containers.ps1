Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$containerNames = @(
  "careline-api-gateway",
  "careline-emergency",
  "careline-admin",
  "careline-appointment",
  "careline-doctor",
  "careline-patient",
  "careline-auth",
  "careline-rabbit",
  "careline-mongo"
)

function Assert-DockerAvailable {
  try {
    & docker version | Out-Null
  } catch {
    throw "Docker is not available. Start Docker Desktop and try again."
  }
}

Assert-DockerAvailable

$existing = & docker ps -a --format "{{.Names}}"

foreach ($name in $containerNames) {
  if ($existing -contains $name) {
    Write-Host "Stopping and removing: $name"
    & docker rm -f $name | Out-Null
  } else {
    Write-Host "Not found: $name"
  }
}

Write-Host ""
Write-Host "CareLine360 containers stopped and removed."
Write-Host "Docker network 'careline-net' is kept for reuse."
