param(
    [string]$ResourceGroup = 'rg-vesper-web',
    [string]$Name = 'vesper-the-hollow-bell',
    [string]$Subscription
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$target = @('--resource-group', $ResourceGroup, '--name', $Name)
if ($Subscription) { $target += @('--subscription', $Subscription) }

$details = az webapp show @target --query '{host:defaultHostName,kind:kind}' --output json --only-show-errors
if ($LASTEXITCODE -ne 0) { throw 'Cannot access the App Service. Check az login, subscription, resource group and app name.' }
$site = $details | ConvertFrom-Json
if ($site.kind -match 'linux|functionapp') { throw 'This static IIS package requires a Windows App Service web app.' }

$archive = Join-Path ([System.IO.Path]::GetTempPath()) ("vesper-" + [guid]::NewGuid().ToString('N') + '.zip')
Push-Location $root
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'The production build failed; nothing was deployed.' }
    if (!(Test-Path -LiteralPath (Join-Path $root 'dist\web.config'))) { throw 'The IIS hosting configuration is missing from the build.' }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $root 'dist'), $archive)

    az webapp config appsettings set @target --settings WEBSITE_RUN_FROM_PACKAGE=1 SCM_DO_BUILD_DURING_DEPLOYMENT=false --output none --only-show-errors
    if ($LASTEXITCODE -ne 0) { throw 'Could not configure atomic package deployment.' }
    az webapp deploy @target --src-path $archive --type zip --timeout 180000 --output none --only-show-errors
    if ($LASTEXITCODE -ne 0) { throw 'Azure rejected the deployment. Inspect the App Service deployment logs.' }
    Write-Output "Package deployed to https://$($site.host)/"
}
finally {
    Pop-Location
    if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive }
}
