// ── 地图 / 气味钉 ──────────────────────────────────────
/** 嗅一嗅半径（米） */
export const PIN_RADIUS_METERS = 50;

/** 公开气味钉默认存活时长（毫秒） */
export const PIN_DEFAULT_TTL_MS = 72 * 60 * 60 * 1000; // 72h

/** 活动场景内个人气味钉默认存活时长（毫秒） */
export const PIN_EVENT_TTL_MS = 6 * 60 * 60 * 1000; // 6h

/** 单条留言字数上限 */
export const PIN_MAX_CONTENT_LENGTH = 280;

/** 气味钉互动续命奖励时长（毫秒，Phase 2） */
export const PIN_INTERACTION_BONUS_MS = 60 * 60 * 1000; // +1h

/** 互动续命上限：距创建时间最多延长 30 天（Phase 2） */
export const PIN_MAX_EXTEND_DAYS = 30;

// ── 举报 ───────────────────────────────────────────────
/** 举报累计达到此阈值后自动隐藏（可通过环境变量覆盖） */
export const REPORT_HIDE_THRESHOLD = 3;

// ── 闻过幂等 ───────────────────────────────────────────
/** 同一设备对同一气味钉的浏览计数去重窗口（秒） */
export const VIEW_DEDUP_TTL_SECONDS = 3600; // 1h

// ── 行进模式（Phase 2） ────────────────────────────────
/** 行进模式同行者识别半径（米） */
export const MOTION_GROUP_RADIUS_METERS = 100;

/** 行进模式速度阈值（km/h），低于此不触发 */
export const MOTION_MIN_SPEED_KMH = 30;

/** GPS 上报间隔（毫秒） */
export const MOTION_GPS_INTERVAL_MS = 10_000; // 10s

/** 轨迹一致性验证窗口（毫秒） */
export const MOTION_TRAJECTORY_WINDOW_MS = 60_000; // 60s

/** 轨迹向量余弦相似度阈值 */
export const MOTION_TRAJECTORY_SIMILARITY = 0.95;

/** 行进聊天室人数上限 */
export const MOTION_ROOM_MAX_MEMBERS = 10;

// ── 身份 ───────────────────────────────────────────────
/** BIP39 助记词位数 */
export const RECOVERY_PHRASE_BITS = 128; // 12 words

/** PBKDF2 迭代次数 */
export const PBKDF2_ITERATIONS = 100_000;

/** PBKDF2 盐值（固定，公开已知） */
export const PBKDF2_SALT = 'peemail-identity';

/** 私密日记密钥派生 info 字符串 */
export const HKDF_INFO_PRIVATE_DIARY = 'private-diary';

/** JWT 有效期 */
export const JWT_EXPIRES_IN = '30d';
