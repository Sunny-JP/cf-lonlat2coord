// --- 地球パラメータとヘルパー関数 ---
// GRS80 楕円体パラメータ
const GRS80_A = 6378137.0; // 長半径 (m)
const GRS80_F = 1 / 298.257222101; // 扁平率
const GRS80_E2 = GRS80_F * (2 - GRS80_F); // 第1離心率の2乗
const R_EARTH_KM_FOR_BEARING = 6371; // 方位角計算に用いる平均半径 (km)

const deg2rad = (deg) => (deg * Math.PI) / 180;
const rad2deg = (rad) => (rad * 180) / Math.PI;

/**
 * 指定した緯度における緯度1度あたりの距離(km)を計算します (子午線弧長)
 * @param {number} lat_deg - 緯度(度)
 * @returns {number} - 緯度1度あたりの距離(km)
 */
function getKmPerLatitudeDegree(lat_deg) {
  const lat_rad = deg2rad(lat_deg);
  const sin_lat = Math.sin(lat_rad);
  const w = Math.sqrt(1 - GRS80_E2 * sin_lat * sin_lat);
  const m = (GRS80_A * (1 - GRS80_E2)) / (w * w * w); // 子午線曲率半径 (m)
  return (m * Math.PI) / 180 / 1000; // 1度あたりの距離(km)に変換
}

/**
 * 指定した緯度における経度1度あたりの距離(km)を計算します (卯酉線弧長)
 * @param {number} lat_deg - 緯度(度)
 * @returns {number} - 経度1度あたりの距離(km)
 */
function getKmPerLongitudeDegree(lat_deg) {
  const lat_rad = deg2rad(lat_deg);
  const sin_lat = Math.sin(lat_rad);
  const w = Math.sqrt(1 - GRS80_E2 * sin_lat * sin_lat);
  const n = GRS80_A / w; // 卯酉線曲率半径 (m)
  return (n * Math.cos(lat_rad) * Math.PI) / 180 / 1000; // 1度あたりの距離(km)に変換
}

function calculate() {
  // --- 入力値の取得 ---
  const lat_origin = parseFloat(document.getElementById("lat_origin").value);
  const lon_origin = parseFloat(document.getElementById("lon_origin").value);
  const lat_start_fault = parseFloat(
    document.getElementById("lat_start_fault").value
  );
  const lon_start_fault = parseFloat(
    document.getElementById("lon_start_fault").value
  );
  const strike = parseFloat(document.getElementById("strike").value);
  const length = parseFloat(document.getElementById("length").value);

  // --- 入力値の検証 ---
  if (
    isNaN(lat_origin) ||
    isNaN(lon_origin) ||
    isNaN(lat_start_fault) ||
    isNaN(lon_start_fault) ||
    isNaN(strike) ||
    isNaN(length)
  ) {
    alert("すべての項目に有効な数値を入力してください。");
    return;
  }

  // --- Step 1: 断層の「終点」の絶対緯度経度を計算 ---
  const lat_start_rad = deg2rad(lat_start_fault);
  const lon_start_rad = deg2rad(lon_start_fault);
  const bearing_rad = deg2rad(strike);
  const distance_km = length;

  let lat_end_rad = Math.asin(
    Math.sin(lat_start_rad) * Math.cos(distance_km / R_EARTH_KM_FOR_BEARING) +
      Math.cos(lat_start_rad) *
        Math.sin(distance_km / R_EARTH_KM_FOR_BEARING) *
        Math.cos(bearing_rad)
  );
  let lon_end_rad =
    lon_start_rad +
    Math.atan2(
      Math.sin(bearing_rad) *
        Math.sin(distance_km / R_EARTH_KM_FOR_BEARING) *
        Math.cos(lat_start_rad),
      Math.cos(distance_km / R_EARTH_KM_FOR_BEARING) -
        Math.sin(lat_start_rad) * Math.sin(lat_end_rad)
    );
  const lat_end_deg = rad2deg(lat_end_rad);
  const lon_end_deg = rad2deg(lon_end_rad);

  // --- Step 2: 絶対緯度経度を、基準点からの「相対XY座標(km)」に変換 ---

  // 始点のXY座標を計算
  // 基準点と始点の中間緯度を計算し、その緯度での距離/度を算出
  const mid_lat_start = (lat_start_fault + lat_origin) / 2;
  const km_per_lat_start = getKmPerLatitudeDegree(mid_lat_start);
  const km_per_lon_start = getKmPerLongitudeDegree(mid_lat_start);
  const y_start = (lat_start_fault - lat_origin) * km_per_lat_start;
  const x_start = (lon_start_fault - lon_origin) * km_per_lon_start;

  // 終点のXY座標を計算
  // 基準点と終点の中間緯度を計算し、その緯度での距離/度を算出
  const mid_lat_end = (lat_end_deg + lat_origin) / 2;
  const km_per_lat_end = getKmPerLatitudeDegree(mid_lat_end);
  const km_per_lon_end = getKmPerLongitudeDegree(mid_lat_end);
  const y_end = (lat_end_deg - lat_origin) * km_per_lat_end;
  const x_end = (lon_end_deg - lon_origin) * km_per_lon_end;

  // --- 結果の表示 ---
  const resultElement = document.getElementById("result");
  resultElement.innerHTML = `
                <p><strong>始点:</strong> (x: ${x_start.toFixed(
                  4
                )} km, y: ${y_start.toFixed(4)} km)</p>
                <p><strong>終点:</strong> (x: ${x_end.toFixed(
                  4
                )} km, y: ${y_end.toFixed(4)} km)</p>
            `;
}

// ページ読み込み時に一度計算を実行
window.onload = calculate;
