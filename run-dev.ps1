param(
  [switch]$NoRedis
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (Test-Path "$root\.venv\Scripts\Activate.ps1") {
  . "$root\.venv\Scripts\Activate.ps1"
} else {
  Write-Host "Виртуальная среда не найдена: $root\.venv" -ForegroundColor Yellow
}

$redisExe = Get-Command redis-server -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source
if (-not $redisExe) {
  $candidates = @(
    "C:\\Program Files\\Redis\\redis-server.exe",
    "C:\\Program Files\\RedisStack\\redis-server.exe",
    "C:\\Program Files\\RedisStack\\bin\\redis-server.exe",
    "C:\\Redis\\redis-server.exe"
  )
  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      $redisExe = $candidate
      break
    }
  }
}

if (-not $NoRedis) {
  if ($redisExe) {
    Start-Process -FilePath $redisExe -WindowStyle Normal
  } else {
    Write-Host "Redis не найден. Установи Redis или добавь redis-server в PATH. Для запуска без Redis: .\\run-dev.ps1 -NoRedis" -ForegroundColor Yellow
  }
}

Start-Process -FilePath "celery" -ArgumentList "-A texnostrelka worker -l info -P solo" -WindowStyle Normal
Start-Process -FilePath "celery" -ArgumentList "-A texnostrelka beat -l info" -WindowStyle Normal

python manage.py runserver 0.0.0.0:8000
