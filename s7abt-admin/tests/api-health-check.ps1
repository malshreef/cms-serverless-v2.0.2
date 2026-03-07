# S7abt CMS API Health Check Script
# Run: powershell -ExecutionPolicy Bypass -File api-health-check.ps1

$API = "https://wtti9qhhe3.execute-api.us-east-1.amazonaws.com/prod"

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  S7ABT CMS - Production API Health Check" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  API: $API" -ForegroundColor Gray
Write-Host "  Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

$endpoints = @(
    @{ Name = "Sections List"; Path = "/admin/sections" },
    @{ Name = "Tags List"; Path = "/admin/tags" },
    @{ Name = "Articles List"; Path = "/admin/articles?page=1&limit=5" },
    @{ Name = "News List"; Path = "/admin/news?page=1&limit=5" },
    @{ Name = "Tweets List"; Path = "/admin/tweets" },
    @{ Name = "Analytics Insights"; Path = "/admin/analytics/insights?range=30d&contentType=all" },
    @{ Name = "Auth Me"; Path = "/admin/auth/me" },
    @{ Name = "Dashboard Stats"; Path = "/admin/dashboard/stats" }
)

$passed = 0
$failed = 0

foreach ($ep in $endpoints) {
    $name = $ep.Name.PadRight(25)
    $url = $API + $ep.Path

    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -ErrorAction Stop
        Write-Host "  $name " -NoNewline
        Write-Host "[200 OK]" -ForegroundColor Green
        $passed++
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Host "  $name " -NoNewline

        if ($statusCode -eq 401) {
            Write-Host "[401 Auth Required]" -ForegroundColor Yellow -NoNewline
            Write-Host " - API working, needs JWT" -ForegroundColor Gray
            $passed++  # 401 means API is working, just needs auth
        }
        elseif ($statusCode -eq 403) {
            Write-Host "[403 Forbidden]" -ForegroundColor Yellow -NoNewline
            Write-Host " - CORS or auth issue" -ForegroundColor Gray
            $passed++  # 403 from Cognito authorizer is expected without token
        }
        elseif ($statusCode -eq 500) {
            Write-Host "[500 Server Error]" -ForegroundColor Red
            $failed++
        }
        else {
            Write-Host "[$statusCode]" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "  Total:  $($passed + $failed)" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  All API endpoints are responding correctly!" -ForegroundColor Green
    Write-Host "  401/403 responses are expected without authentication." -ForegroundColor Gray
}
else {
    Write-Host "  Some endpoints have issues. Check the 500 errors above." -ForegroundColor Red
}

Write-Host ""
