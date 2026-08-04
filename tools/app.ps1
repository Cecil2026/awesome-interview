<#
.SYNOPSIS
Manage awesome-interview as a Windows background service (single entry point).

.DESCRIPTION
One script, verb subcommands. Wraps a Scheduled Task that runs
tools/run_service.py at boot, restarts on failure, and (optionally) adds an
inbound firewall rule for the chosen port. Requires Administrator for every
command except 'status' (right-click PowerShell -> Run as Administrator).

.PARAMETER Command
What to do:
  install    Build indexes, (re)register the Scheduled Task + firewall rule, start it, verify. (default)
  start      Start the already-registered task and verify it comes up.
  stop       Stop the running task.
  restart    Stop then start the task (use after editing markdown / code).
  status     Show task + port + firewall status. Does not change anything (no admin needed).
  uninstall  Stop + unregister the task + remove the firewall rule.

.PARAMETER Port
TCP port to bind. Default: 8099

.PARAMETER TaskName
Scheduled Task name. Default: awesome-interview

.PARAMETER PythonExe
Python launcher. Default: python.exe (must be on PATH).
Pass a full path if not on PATH or when using -RunAsSystem.

.PARAMETER RunAsSystem
Run as SYSTEM (no user logon required). Default: runs as current user (S4U,
also no logon required, but uses your user profile / PATH). Only used by 'install'.

.PARAMETER NoFirewall
Skip adding / removing the Windows Firewall inbound rule.

.EXAMPLE
# Install with defaults (port 8099)
.\tools\app.ps1 install

# Custom port
.\tools\app.ps1 install -Port 9000

# Run as SYSTEM with explicit Python path
.\tools\app.ps1 install -RunAsSystem -PythonExe "C:\Python313\python.exe"

# Restart after editing markdown / code
.\tools\app.ps1 restart

# Stop / start
.\tools\app.ps1 stop
.\tools\app.ps1 start

# Check status (no admin required)
.\tools\app.ps1 status

# Remove
.\tools\app.ps1 uninstall

.NOTES
State-changing commands require Administrator. Run PowerShell as Administrator
before invoking. After install, the service is reachable at:
  http://localhost:<port>/        (this machine)
  http://<your-lan-ip>:<port>/    (same LAN, via firewall rule)
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('install', 'start', 'stop', 'restart', 'status', 'uninstall')]
    [string]$Command = 'install',
    [int]$Port = 8099,
    [string]$TaskName = 'awesome-interview',
    [string]$PythonExe = 'python.exe',
    [switch]$RunAsSystem,
    [switch]$NoFirewall
)

$ErrorActionPreference = 'Stop'

# ---- locate repo root ----
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runScript = Join-Path $repoRoot 'tools\run_service.py'
if (-not (Test-Path $runScript)) {
    throw "Cannot find tools\run_service.py - make sure this script lives in the repo's tools\ directory."
}

# ---- helpers ----
function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($id)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Assert-Admin {
    if (-not (Test-Admin)) {
        throw "'$Command' must run as Administrator. Right-click PowerShell -> Run as Administrator, then retry."
    }
}

function Wait-ForService {
    Write-Host "==> Waiting for service to come up..."
    Start-Sleep -Seconds 3
    for ($i = 0; $i -lt 10; $i++) {
        try {
            $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 2
            if ($r.StatusCode -eq 200) { return $true }
        } catch {}
        Start-Sleep -Seconds 1
    }
    return $false
}

function Show-Endpoints {
    $lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -First 1 -ExpandProperty IPAddress)
    Write-Host "    Local:    http://localhost:$Port/"
    if ($lanIp) { Write-Host "    LAN:      http://${lanIp}:$Port/" }
}

function Show-ManageHint {
    Write-Host ""
    Write-Host "    Manage:"
    Write-Host "      .\tools\app.ps1 status"
    Write-Host "      .\tools\app.ps1 restart"
    Write-Host "      .\tools\app.ps1 uninstall"
}

# ---- commands ----
function Invoke-Status {
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
}

function Invoke-Uninstall {
    Assert-Admin
    Write-Host "==> Uninstalling"
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "    task unregistered"
    if (-not $NoFirewall) {
        Remove-NetFirewallRule -DisplayName $TaskName -ErrorAction SilentlyContinue
        Write-Host "    firewall rule removed"
    }
    Write-Host "Done. Repo files at $repoRoot were NOT deleted."
}

function Invoke-Stop {
    Assert-Admin
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $task) { throw "Task '$TaskName' not registered. Run '.\tools\app.ps1 install' first." }
    Write-Host "==> Stopping task"
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Write-Host "    stopped"
}

function Invoke-Start {
    Assert-Admin
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $task) { throw "Task '$TaskName' not registered. Run '.\tools\app.ps1 install' first." }
    Write-Host "==> Starting task"
    Start-ScheduledTask -TaskName $TaskName
}

function Invoke-Restart {
    Assert-Admin
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $task) { throw "Task '$TaskName' not registered. Run '.\tools\app.ps1 install' first." }
    Write-Host "==> Restarting task"
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Start-ScheduledTask -TaskName $TaskName
}

function Invoke-Install {
    Assert-Admin

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

# ---- dispatch ----
switch ($Command) {
    'status'    { Invoke-Status; exit 0 }
    'uninstall' { Invoke-Uninstall; exit 0 }
    'stop'      { Invoke-Stop; exit 0 }
    'start'     { Invoke-Start }
    'restart'   { Invoke-Restart }
    'install'   { Invoke-Install }
}

# ---- verify (start / restart / install) ----
if (-not (Wait-ForService)) {
    Write-Warning "Service did not respond on http://127.0.0.1:$Port within 13 seconds."
    Write-Host "    Check task with:  Get-ScheduledTaskInfo -TaskName '$TaskName'"
    Write-Host "    Check events:     Get-WinEvent -LogName 'Microsoft-Windows-TaskScheduler/Operational' -MaxEvents 20"
    exit 1
}

Write-Host ""
Write-Host "==> $Command OK"
Show-Endpoints
Write-Host "    Task:     $TaskName  (AtStartup trigger, auto-restart on failure)"
Show-ManageHint
