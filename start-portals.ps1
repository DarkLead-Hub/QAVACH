$portals = @("scholarship", "homeloan", "land-mutation", "ration-card", "trade-licence")
foreach ($portal in $portals) {
    $targetDir = "C:\Users\muham\OneDrive\Desktop\hack-surge\QAVACH\portals\$portal"
    # Build a literal command string that robustly updates the path and runs npm
    $commandStr = "`$env:Path = 'C:\Users\muham\AppData\Local\nvm\v22.22.0;' + `$env:Path; title $portal; npm run dev"
    Start-Process powershell -WorkingDirectory $targetDir -ArgumentList "-NoExit", "-Command", $commandStr
}
