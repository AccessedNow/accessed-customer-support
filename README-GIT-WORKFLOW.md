# Git Workflow & Conventional Commits

## Git Commit Convention

Dự án này sử dụng [Conventional Commits](https://www.conventionalcommits.org/) để đảm bảo tính nhất quán của commit messages. Mỗi commit message nên có cấu trúc như sau:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: Một tính năng mới
- `fix`: Sửa lỗi
- `improve`: Cải thiện code
- `refactor`: Tái cấu trúc code không sửa lỗi hoặc thêm tính năng
- `docs`: Thay đổi tài liệu
- `style`: Thay đổi không ảnh hưởng đến ý nghĩa code (khoảng trắng, định dạng, dấu chấm phẩy thiếu,...)
- `chore`: Các thay đổi nhỏ trong quá trình phát triển
- `test`: Thêm hoặc sửa tests
- `perf`: Cải thiện hiệu suất
- `build`: Thay đổi ảnh hưởng đến quy trình build hoặc dependencies
- `ci`: Thay đổi cấu hình CI hoặc scripts
- `config`: Thay đổi cấu hình ứng dụng
- `init`: Khởi tạo tính năng mới lớn
- `i18n`: Đa ngôn ngữ, bản địa hóa
- `data`: Thay đổi liên quan đến dữ liệu, migration
- `security`: Cải thiện bảo mật, vá lỗi bảo mật
- `revert`: Hoàn tác commit trước đó

### Quy tắc

- Type: Phải là chữ thường, không được để trống
- Subject: Không được để trống, không kết thúc bằng dấu chấm
- Header: Tối đa 72 ký tự

### Ví dụ

```
feat(auth): thêm chức năng đăng nhập bằng Google

- Thêm GoogleAuthController và service
- Cập nhật UserRepository để hỗ trợ tài khoản Google
- Thêm unit tests cho chức năng mới

Resolves: #123
```

## Quy trình làm việc

1. Pull code mới nhất từ nhánh `main` hoặc nhánh phát triển
2. Tạo nhánh mới có tên mô tả tính năng/sửa lỗi (vd: `feat/google-auth`, `fix/login-validation`)
3. Phát triển tính năng hoặc sửa lỗi
4. Commit với conventional commit message
5. Push và tạo Pull Request

## Pre-commit hooks

Dự án này sử dụng Husky để chạy các pre-commit hooks:

- **commitlint**: Kiểm tra định dạng commit messages
- **lint**: Chạy linting để đảm bảo chất lượng code
- **test**: Chạy tests để đảm bảo không có lỗi

Nếu commit hoặc push của bạn bị từ chối, hãy đọc lỗi trong console để biết vấn đề cụ thể.
