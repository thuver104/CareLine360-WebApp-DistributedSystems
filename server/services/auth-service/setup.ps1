# Auth-Service Setup Script
# Run this from: server/services/auth-service directory

Write-Host "🔐 Setting up auth-service folder structure..." -ForegroundColor Cyan
Write-Host ""

# Create all required directories
$directories = @(
    "models",
    "controllers",
    "services",
    "routes",
    "middleware",
    "utils",
    "validators",
    "tests",
    "config"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Already exists: $dir" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Folder structure created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy existing files from monolith (see IMPLEMENTATION-GUIDE.md Step 2)" -ForegroundColor White
Write-Host "2. Create new files using code from IMPLEMENTATION-GUIDE.md" -ForegroundColor White
Write-Host "3. Run: npm install" -ForegroundColor White
Write-Host "4. Copy .env.example to .env and configure" -ForegroundColor White
Write-Host "5. Run: npm run dev" -ForegroundColor White
Write-Host ""
