<#
.SYNOPSIS
Install awesome-interview as a Scheduled Task on the local Windows machine.

.DESCRIPTION
Registers a Scheduled Task that runs tools/run_service.py at boot, restarts
on failure, and adds an inbound firewall rule for the chosen port. Requires
Administrator (right-click PowerShell -> Run as Administrator).

.PARAMETER Port
TCP port to bind. Default: 8099

.PARAMETER TaskName
Scheduled Task name. Default: awesome-interview

.PARAMETER PythonExe
Python launcher. Default: python.exe (must be on PATH).
Pass a full path if not on PATH or when using -RunAsSystem.

.PARAMETER RunAsSystem
Run as SYSTEM (no user logon required). Default: runs as current user (S4U,
also no logon required, but uses your user profile / PATH).

.PARAMETER NoFirewall
Skip adding the Windows Firewall inbound rule.

.PARAMETER Status
Show task + port status, don't change anything.

.PARAMETER Restart
Just restart the task (skip re-registration).

.PARAMETER Uninstall
Stop + unregister task + remove firewall rule.

.EXAMPLE
# Install with defaults (port 8099)
.\tools\install.ps1

# Custom port
.\tools\install.ps1 -Port 9000

# Run as SYSTEM with explicit Python path
.\tools\install.ps1 -RunAsSystem -PythonExe "C:\Python313\python.exe"

# Check status
.\tools\install.ps1 -Status

# Restart after editing markdown / code
.\tools\install.ps1 -Restart

# Remove
.\tools\install.ps1 -Uninstall

.NOTES
Requires Administrator. Run PowerShell as Administrator before invoking.
After install, the service is reachable at:
  http://localhost:<port>/        (this machine)
  http://<your-lan-ip>:<port>/    (same LAN, via firewall rule)
#>

[CmdletBinding()]
param(
    [int]$Port = 8099,
    [string]$TaskName = 'awesome-interview',
    [string]$PythonExe = 'python.exe',
    [switch]$RunAsSystem,
    [switch]$NoFirewall,
    [switch]$Status,
    [switch]$Restart,
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

# ---- locate repo root ----
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runScript = Join-Path $repoRoot 'tools\run_service.py'
if (-not (Test-Path $runScript)) {
    throw "Cannot find tools\run_service.py - make sure this script lives in the repo's tools\ directory."
}

# ---- admin check ----
function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($id)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
    throw "This script must run as Administrator. Right-click PowerShell -> Run as Administrator, then retry."
}

# ---- Status ----
if ($Status) {
    Write-Host "==> Status"
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($task) {
        $info = Get-ScheduledTaskInfo -TaskName $TaskName
        Write-Host "Task: $TaskName"
        Write-Host ("  State:        " + $task.State)
        Write-Host ("  Last run:     " + $info.LastRunTime)
        Write-Host ("  Last result:  " + $info.LastTaskResult)
        Write-Host ("  Next run:     " + $info.NextRunTime)
    } else {
        Write-Host "Task '$TaskName' not registered"
    }
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host ("Port ${Port}: LISTENING (PID " + ($conn.OwningProcess -join ', ') + ")")
        try {
            $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 3
            Write-Host ("HTTP probe:   " + $r.StatusCode + " " + $r.StatusDescription)
        } catch {
            Write-Host "HTTP probe:   failed ($($_.Exception.Message))"
        }
    } else {
        Write-Host "Port ${Port}: not listening"
    }
    $fw = Get-NetFirewallRule -DisplayName $TaskName -ErrorAction SilentlyContinue
    if ($fw) {
        Write-Host "Firewall:     rule '$TaskName' exists"
    } else {
        Write-Host "Firewall:     no rule named '$TaskName'"
    }
    exit 0
}

# ---- Uninstall ----
if ($Uninstall) {
    Write-Host "==> Uninstalling"
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "    task unregistered"
    if (-not $NoFirewall) {
        Remove-NetFirewallRule -DisplayName $TaskName -ErrorAction SilentlyContinue
        Write-Host "    firewall rule removed"
    }
    Write-Host "Done. Repo files at $repoRoot were NOT deleted."
    exit 0
}

# ---- Restart only ----
if ($Restart) {
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $task) { throw "Task '$TaskName' not registered yet. Run without -Restart first." }
    Write-Host "==> Restarting task"
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Start-ScheduledTask -TaskName $TaskName
} else {
    # ---- Build indexes ----
    Write-Host "==> Verifying Python"
    $pyOut = & $PythonExe --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "$PythonExe failed: $pyOut" }
    Write-Host "    $pyOut"

    Write-Host "==> Building indexes"
    Push-Location $repoRoot
    try {
        & $PythonExe tools\build_index.py | Out-Null
        & $PythonExe -c "import sys; sys.path.insert(0, 'tools'); from run_service import build_md_index; build_md_index()"
    } finally {
        Pop-Location
    }

    # ---- Register Scheduled Task ----
    Write-Host "==> Registering Scheduled Task '$TaskName'"
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

    $action = New-ScheduledTaskAction `
        -Execute $PythonExe `
        -Argument "tools\run_service.py --host 0.0.0.0 --port $Port --no-build --no-kill" `
        -WorkingDirectory $repoRoot

    $trigger = New-ScheduledTaskTrigger -AtStartup

    if ($RunAsSystem) {
        $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
    } else {
        $principal = New-ScheduledTaskPrincipal -UserId (whoami) -LogonType S4U -RunLevel Highest
    }

    $settings = New-ScheduledTaskSettingsSet `
        -StartWhenAvailable `
        -DontStopOnIdleEnd `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -RestartCount 999 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit (New-TimeSpan -Days 0)

    $task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings
    Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "    task registered and started"

    # ---- Firewall ----
    if (-not $NoFirewall) {
        Write-Host "==> Adding Windows Firewall inbound rule for TCP $Port"
        Remove-NetFirewallRule -DisplayName $TaskName -ErrorAction SilentlyContinue
        New-NetFirewallRule `
            -DisplayName $TaskName `
            -Direction Inbound -Action Allow `
            -Protocol TCP -LocalPort $Port `
            -Profile Any | Out-Null
        Write-Host "    rule '$TaskName' created"
    }
}

# ---- Verify ----
Write-Host "==> Waiting for service to come up..."
Start-Sleep -Seconds 3
$ok = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch {}
    Start-Sleep -Seconds 1
}

if (-not $ok) {
    Write-Warning "Service did not respond on http://127.0.0.1:$Port within 13 seconds."
    Write-Host "    Check task with:  Get-ScheduledTaskInfo -TaskName '$TaskName'"
    Write-Host "    Check events:     Get-WinEvent -LogName 'Microsoft-Windows-TaskScheduler/Operational' -MaxEvents 20"
    exit 1
}

# ---- Show LAN IP for convenience ----
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host ""
Write-Host "==> Install OK"
Write-Host "    Local:    http://localhost:$Port/"
if ($lanIp) { Write-Host "    LAN:      http://${lanIp}:$Port/" }
Write-Host "    Task:     $TaskName  (AtStartup trigger, auto-restart on failure)"
Write-Host ""
Write-Host "    Manage:"
Write-Host "      .\tools\install.ps1 -Status"
Write-Host "      .\tools\install.ps1 -Restart"
Write-Host "      .\tools\install.ps1 -Uninstall"
