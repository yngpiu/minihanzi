---
name: git-commit
description: 'Execute git commit with conventional commit message analysis, intelligent staging, and message generation. Use when user asks to commit changes, create a git commit, or mentions "/commit". Supports: (1) Auto-detecting type and scope from changes, (2) Generating conventional commit messages from diff, (3) Interactive commit with optional type/scope/description overrides, (4) Intelligent file staging for logical grouping'
license: MIT
allowed-tools: Bash
---

# Git Commit với Conventional Commits (Tiếng Việt)

## Tổng quan

Tạo commit git chuẩn hóa, ngữ nghĩa theo specification Conventional Commits. Phân tích diff thực tế để xác định type, scope và message phù hợp.

## Định dạng Conventional Commit

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Mục đích                          |
| ---------- | --------------------------------- |
| `feat`     | Tính năng mới                     |
| `fix`      | Sửa lỗi                          |
| `docs`     | Chỉ tài liệu                      |
| `style`    | Formatting/style (không logic)    |
| `refactor` | Refactor code (không feat/fix)    |
| `perf`     | Cải thiện hiệu năng               |
| `test`     | Thêm/cập nhật test                |
| `build`    | Build system/dependencies         |
| `ci`       | CI/config thay đổi                |
| `chore`    | Bảo trì/linh tinh                 |
| `revert`   | Hoàn tác commit                   |

## Breaking Changes

```
# Dấu ! sau type/scope
feat!: xoá endpoint không dùng nữa

# BREAKING CHANGE footer
feat: cho phép config mở rộng từ config khác

BREAKING CHANGE: hành vi của `extends` key đã thay đổi
```

## Workflow

### 1. Phân tích Diff

```bash
# Nếu đã staged, dùng staged diff
git diff --staged

# Nếu chưa staged, dùng working tree diff
git diff

# Kiểm tra status
git status --porcelain
```

### 2. Stage Files (nếu cần)

Nếu chưa có gì được stage hoặc muốn nhóm các thay đổi khác nhau:

```bash
# Stage file cụ thể
git add path/to/file1 path/to/file2

# Stage theo pattern
git add *.test.*
git add src/components/*

# Stage tương tác
git add -p
```

**Không bao giờ commit secrets** (.env, credentials.json, private keys).

### 3. Tạo Commit Message

Phân tích diff để xác định:

- **Type**: Loại thay đổi gì?
- **Scope**: Module/khu vực nào bị ảnh hưởng?
- **Description**: Tóm tắt một dòng đã thay đổi gì (tiếng Việt, <72 ký tự)

### 4. Thực hiện Commit

```bash
# Một dòng
git commit -m "<type>[scope]: <description>"

# Nhiều dòng với body/footer
git commit -m "$(cat <<'EOF'
<type>[scope]: <description>

<optional body>

<optional footer>
EOF
)"
```

## Best Practices

- Một thay đổi logic trên mỗi commit
- Type/scope giữ nguyên tiếng Anh, **description viết bằng tiếng Việt**
- Mô tả ở hiện tại, ngắn gọn, viết thường, không dấu câu cuối
- Tham chiếu issue: `Closes #123`, `Refs #456`
- Giữ description dưới 72 ký tự

## Git Safety Protocol

- NEVER update git config
- NEVER run destructive commands (--force, hard reset) without explicit request
- NEVER skip hooks (--no-verify) unless user asks
- NEVER force push to main/master
- If commit fails due to hooks, fix and create NEW commit (don't amend)