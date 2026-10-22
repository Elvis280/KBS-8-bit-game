Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("public/assets/tiles/ground_act1_tile.png")
$diff = 0
for ($y = 25; $y -lt 260; $y++) {
    $c1 = $b.GetPixel(0, $y)
    $c2 = $b.GetPixel($b.Width - 1, $y)
    $d = [Math]::Abs($c1.R - $c2.R) + [Math]::Abs($c1.G - $c2.G) + [Math]::Abs($c1.B - $c2.B)
    $diff += $d
}
Write-Host "Edge color difference: $($diff / 235)"
$b.Dispose()
