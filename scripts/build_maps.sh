#!/usr/bin/env bash
# Build public/maps/districts.geojson: modern district polygons dissolved into the
# historical (1948) districts the book refers to. Inputs are the full-resolution
# Telangana / Andhra Pradesh district GeoJSON files.
set -euo pipefail
TG=${1:?telangana geojson}; AP=${2:?andhra geojson}
OUT=$(dirname "$0")/../public/maps/districts.geojson
EXPR='hd = ({"Nalgonda":"Nalgonda","Suryapet":"Nalgonda","Yadadri Bhuvanagiri":"Nalgonda","Warangal Urban":"Warangal","Warangal Rural":"Warangal","Jangaon":"Warangal","Mahabubabad":"Warangal","Jayashankar Bhupalapally":"Warangal","Mulugu":"Warangal","Khammam":"Khammam","Bhadradri Kothagudem":"Khammam","Karimnagar":"Karimnagar","Jagtial":"Karimnagar","Peddapalli":"Karimnagar","Rajanna Sircilla":"Karimnagar","Adilabad":"Adilabad","Komaram Bheem":"Adilabad","Mancherial":"Adilabad","Nirmal":"Adilabad","Nizamabad":"Nizamabad","Kamareddy":"Nizamabad","Medak":"Medak","Sangareddy":"Medak","Siddipet":"Medak","Mahabubnagar":"Mahbubnagar","Nagarkurnool":"Mahbubnagar","Wanaparthy":"Mahbubnagar","Jogulamba Gadwal":"Mahbubnagar","Narayanpet":"Mahbubnagar","Hyderabad":"Hyderabad","Ranga Reddy":"Hyderabad","Medchal Malkajgiri":"Hyderabad","Vikarabad":"Hyderabad","Krishna":"Krishna","NTR":"Krishna","Guntur":"Guntur","Palnadu":"Guntur","Bapatla":"Guntur","West Godavari":"West Godavari","Eluru":"West Godavari","East Godavari":"East Godavari","Kakinada":"East Godavari","Konaseema":"East Godavari","Prakasam":"Ongole","Kurnool":"Kurnool","Nandyal":"Kurnool"})[district] || null, region = st_nm == "Telangana" ? "telangana" : "andhra"'
npx --yes mapshaper -i "$TG" "$AP" combine-files -merge-layers force -each "$EXPR" -filter 'hd != null' \
  -dissolve hd copy-fields=region -simplify 6% keep-shapes -clean -o precision=0.0001 format=geojson "$OUT"
echo "wrote $OUT"
