param(
  [string]$Out = (Join-Path (Split-Path $PSScriptRoot -Parent) 'artkull-form.zip')
)

$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
try {
  Remove-Item -LiteralPath $Out -ErrorAction SilentlyContinue
  tar -a -c -f $Out index.js package.json lib certs
  if ($LASTEXITCODE -ne 0) { throw 'tar failed to build the archive' }

  $entries = @(tar -tf $Out)
  $required = @(
    'index.js',
    'package.json',
    'lib/handler.js',
    'lib/max.js',
    'lib/validate.js',
    'certs/russian_trusted_root_ca.pem'
  )
  foreach ($item in $required) {
    if ($entries -notcontains $item) {
      throw "ZIP is missing '$item'. Entries: $($entries -join ', ')"
    }
  }

  Write-Output "OK: $Out"
  $entries | ForEach-Object { Write-Output $_ }
} finally {
  Pop-Location
}
