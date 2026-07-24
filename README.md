# Destinyfindor

「命運校準｜自我命運修正系統」的正式主程式庫。

## 專案結構

- `bazi28/`：Web App 前端與 GitHub Pages 發佈來源
- `supabase/functions/`：AI、守護天使與模型更新 Edge Functions
- `supabase/migrations/`：資料庫結構與 RLS 安全規則
- `.github/workflows/deploy-bazi28.yml`：GitHub Pages 自動部署

## 正式網站

https://ptgaminglife.github.io/destinyfindor/

## 部署方式

每次更新 `main` 分支的 `bazi28/**`，GitHub Actions 會自動部署至 GitHub Pages，不需要跨 repo Token。

本程式庫由 `PTgamingLife/mainwork` 的命運校準專案獨立整理而來。
