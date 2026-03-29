import { customType } from 'drizzle-orm/pg-core';

/**
 * PostGIS geography(Point, 4326) 自定义类型
 * 用于气味钉坐标存储和空间索引查询
 */
export const geographyPoint = customType<{
  data: { lat: number; lng: number };
  driverData: string;
}>({
  dataType() {
    return 'geography(Point, 4326)';
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value) {
    // PostGIS 返回 WKB hex，解析交给应用层或 ST_AsGeoJSON
    const match = String(value).match(/POINT\(([^ ]+) ([^ )]+)\)/);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }
    return { lat: 0, lng: 0 };
  },
});

/**
 * PostGIS geography(Polygon, 4326) 自定义类型
 * 用于活动场馆地理围栏
 */
export const geographyPolygon = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'geography(Polygon, 4326)';
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    return String(value);
  },
});
