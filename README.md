# dsh-dl-pulse

DSH Web GUI **实时下载进度**插件：输入框左侧纯文字显示下载进度，事件驱动推送（**零轮询**）。

## 效果

无下载时完全不显示；下载中在输入区最左侧实时滚动一行纯文字：

```
↓ Anaconda3-2024.10 45% (450 MB/996 MB · 1.2 MB/s)
```

- 数字每写入一块进度就推送一次（`fs.watch` + SSE），不是定时刷新
- 速度由客户端按相邻事件差值计算
- 下载完成 / 取消（删除进度文件）→ 文字自动消失

## 原理

- **宿主半**：`fs.watch` 监控 `~/.dsh/downloads/`，文件一变 → SSE 推送
- **客户端半**：挂官方 `conversation.input.dock` 插槽（order 5，最左），`EventSource` 接收即时渲染
- 安全：路由仅本机回环可访问（与 dsh-ssh / dsh-aionui-panel 同一信任围栏）

## 进度文件协议

任何下载任务向 `~/.dsh/downloads/<名称>.progress` 写入：

```
<done> <total>
```

- `done` / `total`：字节数，空格分隔
- 文件内容一变（写入 / rename）即实时推送
- 下载完成或取消：**删除该文件**
- 原子性：先写临时文件再 `rename` 覆盖（宿主对 `.progress.tmp` 自动忽略）

## 宿主路由（仅回环）

- `GET /dsh-dl-pulse/state` — JSON 快照
- `GET /dsh-dl-pulse/events` — SSE 流（事件名 `progress`；必须走 exact 注册，prefix 会被 webserver 关闭流）

## 构建与测试

```bash
pnpm install
pnpm --filter dsh-dl-pulse build   # tsc -b && tsdown
pnpm --filter dsh-dl-pulse test    # vitest 冒烟测试（scanDir 协议解析）
```

## 安装到 web profile

```bash
cd ~/.dsh/profiles/web
pnpm add "dsh-dl-pulse@link:D:/dev/dsh/dsh-web-ui/packages/dsh-dl-pulse"
# 并把 "dsh-dl-pulse" 加入 dsh.profile.bundles，然后重启 GUI
```

## License

Apache-2.0（本包）· AI 辅助开发；发布前请自行审阅。

## 第三方代码与署名（Third-party notices）

| 文件 | 来源 | 许可证 |
|---|---|---|
| `build/tsdown.client.ts`、`build/web-platform.ts` | vendored from [dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) `shared/` | Apache-2.0, Copyright 2026 dsh-web-ui contributors |
| `src/index.ts` 的 `isLoopbackRequest`（模式改编） | [dsh-aionui-panel](https://github.com/zhu1090093659/dsh-web-ui) host routes / dsh-ssh 同款信任围栏 | BSD-3-Clause, Copyright 2026 dsh-web-ui contributors |

其余（进度协议、宿主/客户端逻辑、i18n、测试）为原创。
