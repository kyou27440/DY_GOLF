#!/usr/bin/env pwsh
# ============================================================
#  DY_GOLF — 리비젼 자동 업데이트 스크립트
#  사용법:  .\update_revision.ps1
#           .\update_revision.ps1 -Version "v1.4.0" -Desc "새 기능 설명"
# ============================================================

param(
    [string]$Version = "",
    [string]$Desc    = ""
)

Set-Location $PSScriptRoot

# 현재 버전 읽기
$configContent = Get-Content "config.js" -Encoding UTF8 -Raw
if ($configContent -match "var APP_VERSION = '(v[\d\.]+)';") {
    $currentVer = $Matches[1]
} else {
    Write-Host "❌ config.js 에서 APP_VERSION을 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DY_GOLF 리비젼 자동 업데이트 스크립트" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  현재 버전: $currentVer" -ForegroundColor Yellow

# 새 버전 자동 계산 (패치+1)
if ($Version -eq "") {
    $parts = $currentVer.TrimStart('v') -split '\.'
    $parts[2] = [int]$parts[2] + 1
    $newVer = "v" + ($parts -join '.')
} else {
    $newVer = if ($Version.StartsWith('v')) { $Version } else { "v$Version" }
}

Write-Host "  새   버전: $newVer" -ForegroundColor Green
Write-Host ""

# 변경 내역 입력
if ($Desc -eq "") {
    Write-Host "📝 변경 내역 입력 (완료: 빈 줄 Enter):" -ForegroundColor Cyan
    $descLines = @()
    while ($true) {
        $line = Read-Host "  >"
        if ($line -eq "") { break }
        $descLines += $line
    }
    if ($descLines.Count -eq 0) { $descLines = @("기능 개선 및 버그 수정") }
} else {
    $descLines = @($Desc)
}

# ICT 시각 계산 (UTC+7)
$now      = (Get-Date).ToUniversalTime().AddHours(7)
$dateStr  = $now.ToString("yyyy-MM-dd HH:mm")
$buildStr = $dateStr + " (ICT)"
$verSuffix = $newVer.TrimStart('v') + "_" + $now.ToString("yyyyMMdd_HHmm")

Write-Host ""
Write-Host "── 업데이트 내용 ──────────────────────────────" -ForegroundColor Cyan
Write-Host "  버전  : $currentVer → $newVer"
Write-Host "  빌드  : $buildStr"
Write-Host "  변경  : $($descLines -join ' / ')"
Write-Host ""
$confirm = Read-Host "업데이트하시겠습니까? (y/N)"
if ($confirm -notmatch '^[yY]') { Write-Host "❌ 취소." -ForegroundColor Red; exit 0 }

# 1. config.js 업데이트 함수
function Update-ConfigJs($path) {
    $c = Get-Content $path -Encoding UTF8 -Raw
    $c = $c -replace "var APP_VERSION = 'v[\d\.]+';", "var APP_VERSION = '$newVer';"
    $c = $c -replace "var APP_BUILD_TIME = '[^']+';", "var APP_BUILD_TIME = '$buildStr';"
    $c = $c -replace "Supabase Client initialized \(v[\d\.]+\)", "Supabase Client initialized ($newVer)"
    $descJsArr = ($descLines | ForEach-Object { "            '$($_ -replace "'","''")'" }) -join ",`n"
    $newEntry = "`n    {`n        version: '$newVer',`n        date: '$dateStr',`n        items: [`n$descJsArr`n        ]`n    },"
    $c = $c -replace "(var APP_CHANGELOG = \[)", "`$1$newEntry"
    Set-Content $path $c -Encoding UTF8 -NoNewline
    Write-Host "  ✅ $path" -ForegroundColor Green
}

Update-ConfigJs "config.js"
if (Test-Path "js\config.js") { Update-ConfigJs "js\config.js" }

# 2. index.html 업데이트
function Update-IndexHtml($path) {
    $c = Get-Content $path -Encoding UTF8 -Raw
    $c = $c -replace "const VER = '[\d\._]+';", "const VER = '$verSuffix';"
    $c = $c -replace "\?v=[\d\._]+", "?v=$verSuffix"
    $c = $c -replace "v[\d\.]+ DY_GOLF \([^\)]+\)", "$newVer DY_GOLF ($dateStr ICT)"
    Set-Content $path $c -Encoding UTF8 -NoNewline
    Write-Host "  ✅ $path" -ForegroundColor Green
}
Update-IndexHtml "index.html"

# 3. REVISION_LOG.md 업데이트
function Update-RevisionLog($path) {
    $c = Get-Content $path -Encoding UTF8 -Raw
    $descMd = ($descLines | ForEach-Object { "  - $_" }) -join "`n"
    $newBlock = "`n### 🚀 [$newVer] — $dateStr (ICT)`n$descMd`n"
    $c = $c -replace "(## 📜 버전별 변경 이력[^\n]*\n)", "`$1$newBlock"
    Set-Content $path $c -Encoding UTF8 -NoNewline
    Write-Host "  ✅ $path" -ForegroundColor Green
}
Update-RevisionLog "REVISION_LOG.md"

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  🎉 완료!  $currentVer → $newVer  ($buildStr)" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 확인 사항:" -ForegroundColor Yellow
Write-Host "  - pages\ ↔ js\pages\ 파일 동기화 여부" -ForegroundColor Yellow
Write-Host "  - 브라우저 새로고침 후 버전 배너 확인" -ForegroundColor Yellow
