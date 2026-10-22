Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot "..\public\assets\tiles\Act_1"
foreach ($name in @("ground_act1_tile.png", "ground_act1_seamless.png", "ground_act1_main.png")) {
    $bmp = [System.Drawing.Bitmap]::FromFile("$dir\$name")
    Write-Host "=== $name colors ==="
    foreach ($y in @(0, 5, 10, 20, 50, 100, 200, 400)) {
        if ($y -lt $bmp.Height) {
            $c = $bmp.GetPixel([int]($bmp.Width/2), $y)
            Write-Host ("y={0,3}: R={1,3} G={2,3} B={3,3} A={4,3}" -f $y, $c.R, $c.G, $c.B, $c.A)
        }
    }
    $bmp.Dispose()
}
