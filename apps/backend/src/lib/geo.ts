/**
 * 地理格子（geo-hash 简化版）
 *
 * 将经纬度映射到 0.001° 格子，每格约 111m（纬度方向）。
 * 一枚气味钉影响半径 50m，广播时取以钉为中心的 3×3 = 9 个格子，
 * 覆盖所有可能在 50m 内的用户，客户端再做精确距离过滤。
 */
const CELL = 0.001; // 单位：度

export function getGeoRoom(lat: number, lng: number): string {
  return `geo:${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`;
}

/** 返回覆盖目标点 50m 范围的 3×3 邻域房间列表 */
export function getNearbyRooms(lat: number, lng: number): string[] {
  const latCell = Math.floor(lat / CELL);
  const lngCell = Math.floor(lng / CELL);
  const rooms: string[] = [];
  for (let dl = -1; dl <= 1; dl++) {
    for (let dm = -1; dm <= 1; dm++) {
      rooms.push(`geo:${latCell + dl}:${lngCell + dm}`);
    }
  }
  return rooms;
}
