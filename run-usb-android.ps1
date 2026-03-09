param(
  [int]$BackendPort = 8000,
  [int]$MetroPort = 8082
)

$ErrorActionPreference = 'Stop'

$Root = 'C:\Users\utu\CursorProject\texnostrelka2026'
$Mobile = Join-Path $Root 'mobile'
$VenvPython = Join-Path $Root '.venv\Scripts\python.exe'

function Get-AdbPath {
  $cmd = Get-Command adb -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'),
    'C:\Android\Sdk\platform-tools\adb.exe'
  )

  foreach ($p in $candidates) {
    if (Test-Path $p) { return $p }
  }

  throw 'adb не найден. Установи Android SDK Platform-Tools или добавь adb в PATH.'
}

function Test-PortListening([int]$Port) {
  $line = netstat -ano | Select-String ":$Port"
  return [bool]$line
}

if (-not (Test-Path $VenvPython)) {
  python -m venv (Join-Path $Root '.venv')
}

& $VenvPython -m pip install -r (Join-Path $Root 'requirements.txt') | Out-Host
& $VenvPython -m pip install djangorestframework djangorestframework-simplejwt | Out-Host

$adb = Get-AdbPath
& $adb start-server | Out-Host

$devices = & $adb devices
$online = $devices | Select-String "\tdevice$"
if (-not $online) {
  throw "Телефон не найден adb. Проверь USB-кабель, 'Отладка по USB' и подтверждение RSA-ключа на телефоне."
}

if (-not (Test-PortListening -Port $BackendPort)) {
  $cmd = "set SECRET_KEY=dev-secret-key-123 && set DEBUG=True && `"$VenvPython`" manage.py runserver 0.0.0.0:$BackendPort"
  Start-Process -FilePath cmd.exe -ArgumentList '/c', $cmd -WorkingDirectory $Root | Out-Null
  Start-Sleep -Seconds 2
}

if (-not (Test-PortListening -Port $BackendPort)) {
  throw "Не удалось поднять Django на порту $BackendPort"
}

& $adb reverse tcp:$BackendPort tcp:$BackendPort | Out-Host
& $adb reverse tcp:$MetroPort tcp:$MetroPort | Out-Host

Push-Location $Mobile
try {
  npm install | Out-Host

  $env:EXPO_PUBLIC_API_BASE_URL = "http://127.0.0.1:$BackendPort/api/users"
  npx expo run:android --port $MetroPort
}
finally {
  Pop-Location
}
