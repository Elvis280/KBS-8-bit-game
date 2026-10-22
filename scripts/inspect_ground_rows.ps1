Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot "..\public\assets\tiles\Act_1"
foreach ($name in @("ground_act1_tile.png", "ground_act1_seamless.png", "ground_act1_main.png")) {
    $bmp = [System.Drawing.Bitmap]::FromFile("$dir\$name")
    Write-Host "=== $name ($($bmp.Width)x$($bmp.Height)) ==="
    for ($y = 0; $y -lt [Math]::Min(150, $bmp.Height); $y += 5) {
        $count = 0
        $solid = 0
        for ($x = 0; $x -lt $bmp.Width; $x += 10) {
            $a = $bmp.GetPixel($x, $y).A
            if ($a -gt 20) { $count++ }
            if ($a -gt 240) { $solid++ }
        }
        $total = [int]($bmp.Width / 10)
        if ($count -gt 0) {
            Write-Host ("y={0,3}: non-trans={1,4}/{2} | solid={3,4}" -f $y, $count, $total, $solid)
        }
    }
    $bmp.Dispose()
}
