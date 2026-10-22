Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("public/assets/tiles/ground_act1_tile.png")
Write-Host "Tile size: $($b.Width) x $($b.Height)"
for ($y = 0; $y -lt 60; $y += 2) {
    $count = 0
    for ($x = 0; $x -lt $b.Width; $x += 10) {
        if ($b.GetPixel($x, $y).A -gt 15) { $count++ }
    }
    Write-Host "y=$y opaque count=$count / $($b.Width/10)"
}
$b.Dispose()
