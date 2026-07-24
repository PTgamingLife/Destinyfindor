# Destinyfindor

「命運校準｜自我命運修正系統」的正式主程式庫。

## 專案結構

- `bazi28/`：Web App 前端
- `supabase/functions/`：AI、守護天使與模型更新 Edge Functions
- `supabase/migrations/`：資料庫結構與 RLS 安全規則
- `.github/workflows/deploy-bazi28.yml`：同步部署至 `PTgamingLife/28challenge`

## 正式網站

https://ptgaminglife.github.io/28challenge/

## 部署設定

跨 repo 部署需要在本 repo 設定 GitHub Actions secret：`DEPLOY_TOKEN`。

本程式庫由 `PTgamingLife/mainwork` 的命運校準專案獨立整理而來。
