# Télécharge les PDF officiels dans resources/eduscol/ (Windows PowerShell)
$ErrorActionPreference = 'Continue'
$dest = Join-Path $PSScriptRoot '..\resources\eduscol'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Ludidactik/1.0'
$files = @(
  @('cycle2_francais_BO41-2024.pdf', 'https://www.education.gouv.fr/sites/default/files/document/Annexe%203%20%E2%80%93%20Programme%20de%20fran%C3%A7ais%20du%20cycle%202-403818.pdf'),
  @('cycle2_maths_BO41-2024.pdf', 'https://www.education.gouv.fr/sites/default/files/document/Annexe%204%20%E2%80%93%20Programme%20de%20math%C3%A9matiques%20du%20cycle%202-403821.pdf'),
  @('cycle3_francais_BO16-2025.pdf', 'https://www.education.gouv.fr/sites/default/files/programme-de-fran-ais-pour-le-cycle-3-439824.pdf'),
  @('cycle3_maths_BO16-2025.pdf', 'https://www.education.gouv.fr/sites/default/files/programme-de-math-matiques-pour-le-cycle-3-439827.pdf'),
  @('cycle2_histoire-geo_BO22-2026.pdf', 'https://www.education.gouv.fr/sites/default/files/document/annexe-3-programme-d-histoire-geographie-cycle-2-516776.pdf'),
  @('cycle3_histoire-geo_BO22-2026.pdf', 'https://www.education.gouv.fr/sites/default/files/document/annexe-4-programme-d-histoire-geographie-cycle-3-516779.pdf'),
  @('cycle2_sciences_BO24-2026.pdf', 'https://www.education.gouv.fr/sites/default/files/document/annexe-1-programme-de-sciences-et-technologie-du-cycle-2-517289.pdf'),
  @('cycle3_sciences_BO24-2026.pdf', 'https://www.education.gouv.fr/sites/default/files/document/annexe-2-programme-de-sciences-et-technologie-du-cycle-3-517292.pdf'),
  @('cycle2_langues-vivantes_BO12-2026.pdf', 'https://www.education.gouv.fr/sites/default/files/document/Annexe%201%20%E2%80%93%20Programme%20de%20langues%20vivantes%20%C3%A9trang%C3%A8res%20et%20r%C3%A9gionales%20pour%20le%20cycle%202%20-481187.pdf'),
  @('cycle3_langues-vivantes_BO12-2026.pdf', 'https://www.education.gouv.fr/sites/default/files/document/Annexe%202%20%E2%80%93%20Programme%20de%20langues%20vivantes%20%C3%A9trang%C3%A8res%20et%20r%C3%A9gionales%20pour%20les%20classes%20de%20cours%20moyen%20%28cycle%203%29-481190.pdf'),
  @('cm2_hist2020_th1_temps-republique.pdf', 'https://eduscol.education.gouv.fr/sites/default/files/document/ra16c3higecm2th1tempsrepublique619873pdf-77115.pdf'),
  @('cm2_hist2020_th2_age-industriel.pdf', 'https://eduscol.education.gouv.fr/sites/default/files/document/ra16c3higecm2th2ageindustrielfrance619875pdf-77118.pdf'),
  @('cm2_hist2020_th3_guerres-ue.pdf', 'https://eduscol.education.gouv.fr/sites/default/files/document/ra16c3higecm2th3franceguerresmondialesue619877pdf-77121.pdf'),
  @('cm2_geo2020_th1_se-deplacer.pdf', 'https://eduscol.education.gouv.fr/sites/default/files/document/ra16c3higegeocm2th1sedeplacer616750pdf-77142.pdf'),
  @('cm2_geo2020_th2_internet.pdf', 'https://eduscol.education.gouv.fr/sites/default/files/document/ra16c3higegeocm2th2communiquerinternet616752pdf-77145.pdf'),
  @('cm2_geo2020_th3_mieux-habiter.pdf', 'https://eduscol.education.gouv.fr/sites/default/files/document/ra16c3higegeocm2th3mieuxhabiter616754pdf-77148.pdf')
)
foreach ($f in $files) {
  $out = Join-Path $dest $f[0]
  if (Test-Path $out) { Write-Host "deja present : $($f[0])"; continue }
  try { Invoke-WebRequest -Uri $f[1] -OutFile $out -UserAgent $ua -UseBasicParsing; Write-Host "OK  $($f[0])" }
  catch { Write-Warning "ECHEC $($f[0]) : $($_.Exception.Message)" }
}
Write-Host 'Termine. Verifiez resources/eduscol/.'
