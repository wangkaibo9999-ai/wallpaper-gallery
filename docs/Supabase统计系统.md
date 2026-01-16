# Supabase 壁纸统计系统

## 概述

本项目使用 Supabase 作为后端数据库，记录用户的下载和预览行为，用于实现"热门壁纸"、"最受欢迎"等功能。

**为什么不用 Umami？**

- Umami Cloud 免费版只记录事件名称的总次数
- 无法获取事件携带的详细数据（如具体哪个壁纸被下载）
- 因此选择 Supabase 来存储详细的统计数据

---

## 配置方法

### 1. 创建 Supabase 项目

访问 [Supabase](https://supabase.com) 创建项目，获取：

- Project URL
- Anon Key（公开密钥）

### 2. 配置环境变量

在 `.env.production` 中添加：

```env
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

**注意：** 建议只在生产环境配置，测试环境不记录以节省存储空间（免费 500MB）。

### 3. 创建数据库表

在 Supabase SQL Editor 中执行以下 SQL。

---

## 数据库表结构

### 1. wallpaper_downloads（下载记录表）

```sql
CREATE TABLE wallpaper_downloads (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  series TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_downloads_filename ON wallpaper_downloads(filename);
CREATE INDEX idx_downloads_series ON wallpaper_downloads(series);
```

### 2. wallpaper_views（预览记录表）

```sql
CREATE TABLE wallpaper_views (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  series TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_views_filename ON wallpaper_views(filename);
CREATE INDEX idx_views_series ON wallpaper_views(series);
CREATE INDEX idx_views_created_at ON wallpaper_views(created_at);
```

> **注意：** `created_at` 使用 `TIMESTAMP(0) WITHOUT TIME ZONE` 类型，精确到秒，不含时区信息。

### 3. wallpaper_stats_summary（汇总表）

```sql
CREATE TABLE wallpaper_stats_summary (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  series TEXT NOT NULL,
  category TEXT,
  total_downloads BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(filename, series)
);
```

---

## 数据库视图

### download_stats（下载统计）

```sql
CREATE VIEW download_stats AS
SELECT filename, series, category, COUNT(*) as download_count
FROM wallpaper_downloads
GROUP BY filename, series, category
ORDER BY download_count DESC;
```

### view_stats（浏览统计）

```sql
CREATE VIEW view_stats AS
SELECT filename, series, category, COUNT(*) as view_count
FROM wallpaper_views
GROUP BY filename, series, category
ORDER BY view_count DESC;
```

### popular_wallpapers（热门壁纸）

```sql
CREATE VIEW popular_wallpapers AS
SELECT
  COALESCE(d.filename, v.filename) as filename,
  COALESCE(d.series, v.series) as series,
  COALESCE(d.category, v.category) as category,
  COALESCE(d.download_count, 0) as download_count,
  COALESCE(v.view_count, 0) as view_count,
  (COALESCE(d.download_count, 0) * 3 + COALESCE(v.view_count, 0)) as popularity_score
FROM download_stats d
FULL OUTER JOIN view_stats v ON d.filename = v.filename AND d.series = v.series
ORDER BY popularity_score DESC;
```

**热门算法：** `popularity_score = download_count × 3 + view_count`

### popular_wallpapers_weekly（本周热门壁纸）

```sql
CREATE VIEW popular_wallpapers_weekly AS
SELECT
  COALESCE(d.filename, v.filename) as filename,
  COALESCE(d.series, v.series) as series,
  COALESCE(d.category, v.category) as category,
  COALESCE(d.download_count, 0) as download_count,
  COALESCE(v.view_count, 0) as view_count,
  (COALESCE(d.download_count, 0) * 3 + COALESCE(v.view_count, 0)) as popularity_score
FROM (
  SELECT filename, series, category, COUNT(*) as download_count
  FROM wallpaper_downloads
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY filename, series, category
) d
FULL OUTER JOIN (
  SELECT filename, series, category, COUNT(*) as view_count
  FROM wallpaper_views
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY filename, series, category
) v ON d.filename = v.filename AND d.series = v.series
ORDER BY popularity_score DESC;
```

**说明：** 只统计最近 7 天的下载和访问数据，用于"本周热门"排序功能。

### popular_wallpapers_monthly（本月热门壁纸）

```sql
CREATE VIEW popular_wallpapers_monthly AS
SELECT
  COALESCE(d.filename, v.filename) as filename,
  COALESCE(d.series, v.series) as series,
  COALESCE(d.category, v.category) as category,
  COALESCE(d.download_count, 0) as download_count,
  COALESCE(v.view_count, 0) as view_count,
  (COALESCE(d.download_count, 0) * 3 + COALESCE(v.view_count, 0)) as popularity_score
FROM (
  SELECT filename, series, category, COUNT(*) as download_count
  FROM wallpaper_downloads
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY filename, series, category
) d
FULL OUTER JOIN (
  SELECT filename, series, category, COUNT(*) as view_count
  FROM wallpaper_views
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY filename, series, category
) v ON d.filename = v.filename AND d.series = v.series
ORDER BY popularity_score DESC;
```

**说明：** 只统计最近 30 天的下载和访问数据，用于"本月热门"排序功能。

---

## 行级安全策略 (RLS)

```sql
-- 启用 RLS
ALTER TABLE wallpaper_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallpaper_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallpaper_stats_summary ENABLE ROW LEVEL SECURITY;

-- 允许匿名插入和读取
CREATE POLICY "Allow anonymous insert" ON wallpaper_downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON wallpaper_downloads FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert" ON wallpaper_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON wallpaper_views FOR SELECT USING (true);

CREATE POLICY "Allow anonymous select" ON wallpaper_stats_summary FOR SELECT USING (true);
```

---

## 前端上报机制

### 上报工具

文件：`src/utils/supabase.js`

### 上报数据

```json
{
  "filename": "anime_001.jpg",
  "series": "desktop",
  "category": "动漫"
}
```

### 集成位置

| 组件                         | 上报函数           | 触发时机     |
| ---------------------------- | ------------------ | ------------ |
| `WallpaperModal.vue`         | `recordDownload()` | 点击下载按钮 |
| `WallpaperModal.vue`         | `recordView()`     | 打开弹窗     |
| `PortraitWallpaperModal.vue` | `recordDownload()` | 点击下载按钮 |
| `PortraitWallpaperModal.vue` | `recordView()`     | 打开弹窗     |

---

## 定时任务（可选）

### 自动清理与汇总

使用 `pg_cron` 扩展，每周清理 90 天前的明细数据并汇总到 summary 表。

```sql
-- 启用 pg_cron 扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 创建清理函数
CREATE OR REPLACE FUNCTION aggregate_and_cleanup_stats()
RETURNS void AS $$
BEGIN
  -- 汇总下载数据
  INSERT INTO wallpaper_stats_summary (filename, series, category, total_downloads, total_views, updated_at)
  SELECT filename, series, category, COUNT(*), 0, NOW()
  FROM wallpaper_downloads
  WHERE created_at < NOW() - INTERVAL '90 days'
  GROUP BY filename, series, category
  ON CONFLICT (filename, series)
  DO UPDATE SET
    total_downloads = wallpaper_stats_summary.total_downloads + EXCLUDED.total_downloads,
    updated_at = NOW();

  -- 汇总浏览数据
  INSERT INTO wallpaper_stats_summary (filename, series, category, total_downloads, total_views, updated_at)
  SELECT filename, series, category, 0, COUNT(*), NOW()
  FROM wallpaper_views
  WHERE created_at < NOW() - INTERVAL '90 days'
  GROUP BY filename, series, category
  ON CONFLICT (filename, series)
  DO UPDATE SET
    total_views = wallpaper_stats_summary.total_views + EXCLUDED.total_views,
    updated_at = NOW();

  -- 删除旧数据
  DELETE FROM wallpaper_downloads WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM wallpaper_views WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 设置定时任务（每周日凌晨3点执行）
SELECT cron.schedule('weekly-cleanup', '0 3 * * 0', 'SELECT aggregate_and_cleanup_stats()');
```

---

## 存储空间估算

- 每条记录约 150 字节
- 500MB 可存储约 330 万条记录
- 假设每天 1200 条（1000 预览 + 200 下载）
- 90 天保留约 10.8 万条明细（约 16MB）
- **完全够用**

---

## API 使用示例

### 记录下载

```bash
curl -X POST "https://你的项目.supabase.co/rest/v1/wallpaper_downloads" \
  -H "Content-Type: application/json" \
  -H "apikey: 你的ANON_KEY" \
  -H "Authorization: Bearer 你的ANON_KEY" \
  -d '{"filename": "test.jpg", "series": "desktop", "category": "动漫"}'
```

### 获取热门壁纸

```bash
curl "https://你的项目.supabase.co/rest/v1/popular_wallpapers?series=eq.desktop&limit=20" \
  -H "apikey: 你的ANON_KEY"
```

### 获取本周热门壁纸

```bash
curl "https://你的项目.supabase.co/rest/v1/popular_wallpapers_weekly?series=eq.desktop&limit=20" \
  -H "apikey: 你的ANON_KEY"
```

### 获取本月热门壁纸

```bash
curl "https://你的项目.supabase.co/rest/v1/popular_wallpapers_monthly?series=eq.desktop&limit=20" \
  -H "apikey: 你的ANON_KEY"
```

---

## 后续功能规划

| 功能            | 说明                         | 实现方式                                         | 难度 |
| --------------- | ---------------------------- | ------------------------------------------------ | ---- |
| 🔥 热门壁纸区块 | 首页展示热门壁纸 Top 10      | 调用 `popular_wallpapers` 视图                   | 简单 |
| 📊 下载次数显示 | 详情弹窗显示"已下载 xxx 次"  | 查询 `download_stats` 视图                       | 简单 |是·
| 🏷️ 热门标签     | 壁纸卡片角标显示"热门"       | 根据 `popularity_score` 阈值判断                 | 简单 |
| 📈 本周/月热门  | 只统计最近 7/30 天数据       | 新建带时间筛选的视图                             | 中等 |
| 🔀 热度排序     | 筛选面板添加"按热度排序"选项 | 前端调用 API 获取排序数据                        | 中等 |
| ❤️ 用户收藏     | 用户收藏喜欢的壁纸           | 新建 `user_favorites` 表，localStorage 存用户 ID | 中等 |
| 👍 点赞功能     | 用户可以给壁纸点赞           | 新建 `wallpaper_likes` 表                        | 中等 |
| 📉 趋势分析     | 对比本周 vs 上周热度变化     | 复杂查询对比两个时间段                           | 较难 |

**推荐优先级**：热门壁纸区块 → 下载次数显示 → 热门标签（投入小、效果明显）

---

## 注意事项

1. **文件名不要改** - 改了会导致统计数据对不上
2. **只在生产环境上报** - 测试环境不配置，避免浪费存储
3. **静默失败** - 上报失败不影响用户体验
4. **定期检查存储** - 建议每月检查 Supabase 存储使用情况（免费 500MB）
5. **分类名保持一致** - 分类改名后，旧数据的 category 字段不会自动更新
6. **密钥安全** - `anon key` 可放前端；`service_role key` 绝不能暴露
