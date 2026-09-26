# Checklist kiểm thử

Mỗi yêu cầu gửi cho Claude được ghi lại ở đây kèm các bước kiểm thử. Tick `[x]` khi đã test xong.

- FE = frontend (`personal-template`), BE = backend (`nayva-be`).
- Trước khi test: deploy lại BE, deploy Firestore/Storage rules (`firebase deploy --only firestore:rules,storage`), cấu hình `.env.local` (FE) và `.env` (BE).
- Cần 2 tài khoản: một **user** thường và một **admin** (`users/{uid}.role = "admin"` sửa trong Firebase Console).

---

## 1. Đọc hiểu toàn bộ code

Chỉ giải thích, không có gì để test.

---

## 2. Kết nối Firebase: đăng nhập Google/Facebook, lưu thông tin user, lưu dữ liệu lên Firebase

- [ ] Chưa đăng nhập: mở web → chỉ thấy màn hình đăng nhập, không vào được trình soạn thảo
- [ ] Đăng nhập bằng **Google** thành công
- [ ] Đăng nhập bằng **Facebook** thành công
- [ ] Đóng popup đăng nhập giữa chừng → không hiện lỗi
- [ ] Firestore có `users/{uid}` với: tên, email, ảnh, providers, `createdAt`, `lastLoginAt`, `role: "user"`
- [ ] Sửa trang → sau ~1,5 giây toolbar báo "Đã lưu lên đám mây"; tải lại trang → nội dung còn nguyên
- [ ] Mở cùng tài khoản trên máy/trình duyệt khác → thấy đúng thiết kế
- [ ] Tải ảnh lên (nút trong bảng phải, và kéo thả tệp vào trang) → ảnh nằm trong Storage `users/{uid}/images/`, không phải base64
- [ ] Thả 1 ảnh lên hình khối → ảnh lấp vào hình
- [ ] Thiết kế cũ trong localStorage (bản trước Firebase) được chuyển lên đám mây ở lần đăng nhập đầu
- [ ] Sửa rồi đóng tab ngay (chưa kịp lưu) → trình duyệt hỏi xác nhận rời trang
- [ ] Đăng xuất → quay về màn hình đăng nhập; thay đổi đang chờ được lưu trước
- [ ] Rules: user A không đọc được dữ liệu của user B (thử bằng Rules Playground trong Console)

## 3. Đồng bộ rules giữa VS Code và Firebase

- [ ] `firebase use --add` đã nối đúng project (có file `.firebaserc`)
- [ ] `firebase deploy --only firestore:rules,storage` chạy thành công
- [ ] Rules trên Console giống hệt `firestore.rules` / `storage.rules` trong máy

## 4. Nút Lưu thủ công + Ctrl+S (giữ tự lưu)

- [ ] Nút **Lưu** trên toolbar → lưu ngay, báo "Đã lưu thiết kế lên đám mây"
- [ ] **Ctrl+S** lưu được, không mở hộp thoại "Lưu trang" của trình duyệt
- [ ] Ctrl+S khi đang gõ trong ô ở bảng thuộc tính → vẫn lưu
- [ ] Ctrl+S khi đang sửa chữ trực tiếp trên trang → kết thúc sửa, chữ được lưu
- [ ] Tự lưu (không bấm gì) vẫn hoạt động

## 5. Trang chủ: tạo trang trống, mở trang đã lưu, tạo từ mẫu

- [ ] Đăng nhập xong vào **trang chủ**, không vào thẳng trình soạn thảo
- [ ] "Trang trống" → tạo trang mới và mở trình soạn thảo
- [ ] Mục "Trang đã lưu": có ảnh thu nhỏ, thời gian sửa, trang sửa gần nhất đứng đầu
- [ ] Bấm một trang đã lưu → mở đúng trang đó
- [ ] Xoá trang (hỏi xác nhận) → biến mất khỏi danh sách và Firestore
- [ ] URL `#/d/<id>`: tải lại trang vẫn ở đúng trang; nút Back của trình duyệt về trang chủ và thay đổi được lưu
- [ ] Mở link của trang đã bị xoá → báo "không tồn tại" + nút về trang chủ
- [ ] Nút "Trang chủ" trong trình soạn thảo → lưu rồi về trang chủ

## 6. Giới hạn 3 trang mỗi user

- [ ] Bộ đếm "x/3" cạnh "Trang đã lưu"; đỏ khi đủ 3
- [ ] Đủ 3 trang → hiện thông báo, các ô tạo trang bị khoá
- [ ] Xoá 1 trang → tạo được lại
- [ ] Mở 2 tab, tạo trang ở cả hai khi đang có 2 trang → tab thứ hai bị chặn, báo lỗi và tải lại danh sách

## 7. Lấy thiết kế của user làm mẫu (admin)

- [ ] User thường **không** thấy nút "Quản trị"; vào thẳng `#/admin` → "Không có quyền truy cập"
- [ ] Admin thấy nút "Quản trị" trên trang chủ
- [ ] Tab "Người dùng": danh sách user, tìm theo tên/email, nhãn **Admin** cạnh admin
- [ ] Chọn user → thấy các trang của họ; "Xem" mở xem trước
- [ ] "Lưu làm mẫu" → nhập tên/mô tả → mẫu hiện trong tab "Mẫu đã tạo" và ở mục "Tạo trang mới" của mọi user
- [ ] Ảnh của mẫu được chép sang Storage `templates/images/` (cần cấu hình CORS `cors.json`)
- [ ] Admin mở trang của chính mình → toolbar có nút "Lưu làm mẫu"
- [ ] Xoá mẫu → biến mất khỏi trang chủ; trang user đã tạo từ mẫu không bị ảnh hưởng
- [ ] Admin **không sửa được** thiết kế của user (chỉ đọc)

## 8. Bỏ nút Mở, Tải JSON, Xuất HTML khỏi trình soạn thảo

- [ ] Toolbar không còn 3 nút này
- [ ] Xem trước → "Tab mới" vẫn mở trang dạng HTML

## 9. Hai role user/admin, mặc định user, đổi sang admin trong Firebase Console

- [ ] Tài khoản mới có `role: "user"`
- [ ] Tài khoản cũ chưa có role được thêm `role: "user"` khi đăng nhập
- [ ] Sửa `role` thành `admin` trong Console, tải lại web → có quyền admin
- [ ] User **không tự đổi được** role (thử ghi `role: "admin"` bằng Rules Playground → bị từ chối)
- [ ] User không xoá được hồ sơ của mình
- [ ] Đăng nhập lại không ghi đè role admin về user

## 10. Xoá 2 mẫu viết cứng trong code

- [ ] "Tạo trang mới" chỉ có "Trang trống" + các mẫu admin đã đăng
- [ ] Cột trái trình soạn thảo không còn mục "Mẫu trang"
- [ ] Trang đã tạo từ mẫu cũ vẫn mở bình thường

## 11. Xuất bản phải chờ admin duyệt (chống spam)

- [ ] Trình soạn thảo có nút **Xuất bản** → hộp thoại trạng thái
- [ ] Gửi yêu cầu → thay đổi đang dở được lưu trước; trạng thái "Đang chờ duyệt"
- [ ] Sửa trang sau khi gửi → admin xem/duyệt vẫn là **bản lúc gửi**
- [ ] Đang chờ duyệt → không gửi thêm được; "Huỷ yêu cầu" hoạt động
- [ ] Gửi quá 3 yêu cầu đang chờ (tính cả trang đã xoá) → bị chặn
- [ ] Admin tab "Duyệt xuất bản": lọc Chờ duyệt / Đã duyệt / Đã từ chối
- [ ] "Xem" hiện đúng bản đã chụp
- [ ] "Từ chối" bắt buộc lý do → user thấy lý do trong hộp thoại xuất bản
- [ ] "Duyệt" → trang lên Vercel, user thấy link công khai
- [ ] Gọi thẳng `POST /api/designs/:id/deploy` → 404 (route đã bỏ)
- [ ] User thường gọi API `/api/admin/...` → 403
- [ ] Hai admin bấm duyệt cùng một yêu cầu → chỉ một người thành công

## 12. Icon + tiêu đề web; chọn tên miền khi xuất bản; không trùng; 1 tên miền/user; đổi phải chờ duyệt

- [ ] Cài đặt trang → mục **Website**: sửa tiêu đề, tải icon, bỏ icon
- [ ] Trang đã xuất bản có đúng tiêu đề tab và favicon
- [ ] Chưa có tên miền: hộp thoại xuất bản yêu cầu chọn tên miền; gợi ý sẵn từ tiêu đề (bỏ dấu)
- [ ] Kiểm tra tên khi gõ: ✓ dùng được / ✗ kèm lý do (quá ngắn, ký tự sai, tên hệ thống giữ, đã có người dùng)
- [ ] Nút "Gửi yêu cầu xuất bản" bị khoá khi chưa có tên miền
- [ ] Chọn tên lần đầu → có hỏi xác nhận, có hiệu lực ngay
- [ ] User B không chọn được tên user A đang dùng hoặc đang chờ duyệt
- [ ] Hai user chọn cùng một tên cùng lúc → chỉ một người được
- [ ] "Đổi tên miền" → gửi yêu cầu, tên mới được giữ chỗ, web vẫn chạy ở tên cũ
- [ ] Đang chờ đổi → không gửi yêu cầu đổi khác được; "Huỷ yêu cầu đổi" nhả tên đang giữ
- [ ] Admin tab "Đổi tên miền": duyệt / từ chối (bắt buộc lý do); user thấy lý do
- [ ] Nhập nguyên `ten.vercel.app` vào ô → vẫn hiểu là `ten`

## 13. Bỏ chờ 5 phút giữa các lần gửi yêu cầu xuất bản

- [ ] Bị từ chối → gửi lại ngay được
- [ ] Huỷ yêu cầu → gửi lại ngay được

## 14. Trang chủ hiện trạng thái xuất bản trên từng thiết kế

- [ ] Nhãn **Chờ duyệt** trên trang đang chờ (rê chuột thấy thời gian gửi)
- [ ] Nhãn **Đang xuất bản** + viền xanh + link công khai trên trang đang chạy
- [ ] Nhãn **Bản cập nhật chờ duyệt** khi trang đang chạy có bản sửa chờ duyệt
- [ ] Nhãn **Đang triển khai** ngay sau khi admin duyệt
- [ ] Nhãn **Bị từ chối** (rê chuột thấy lý do)
- [ ] Để trang chủ mở trong lúc admin duyệt → nhãn tự đổi trong ~20 giây, không cần tải lại
- [ ] Xoá trang đang xuất bản → hộp xác nhận có cảnh báo thêm
- [ ] Tắt BE → trang chủ vẫn dùng được, chỉ không có nhãn

## 15. Mỗi user chỉ 1 web; xuất bản thiết kế khác thì xoá web cũ trên Vercel rồi deploy lại

- [ ] Xuất bản trang A → trên Vercel có 1 project
- [ ] Gửi xuất bản trang B, admin duyệt → project của A **bị xoá** khỏi Vercel, chỉ còn project của B
- [ ] Tên miền hiển thị trang B
- [ ] Cập nhật lại chính trang B → không xoá project, chỉ deploy lại
- [ ] Trang chủ: nhãn "Đang xuất bản" chuyển từ A sang B

## 16. Cảnh báo cho user khi gửi yêu cầu; admin bấm duyệt không có cảnh báo

- [ ] Đang có web trang A, gửi xuất bản trang B → hiện hộp xác nhận "trang cũ sẽ bị XOÁ HẲN"; bấm Huỷ thì không gửi
- [ ] Lần xuất bản đầu tiên / cập nhật chính trang đang chạy → **không** hiện cảnh báo
- [ ] Admin bấm "Duyệt" → deploy ngay, không có hộp xác nhận

## 17. Admin chỉ cần bấm duyệt 1 lần khi chuyển sang thiết kế khác (lỗi "tên miền đã được dùng ở nơi khác trên Vercel")

- [ ] Đang có web trang A, admin duyệt trang B **một lần** → thành công, không còn lỗi 409
- [ ] Nút "Duyệt" có thể chờ tới ~30 giây, hiện "Đang xuất bản…"

## 18. Duyệt đổi tên miền thì cập nhật tên miền ở mọi nơi

- [ ] Sau khi duyệt: web chạy ở tên **mới**
- [ ] Tên **cũ** không còn chạy (gỡ khỏi Vercel)
- [ ] Tên cũ được nhả: user khác chọn được tên đó
- [ ] Trang chủ và hộp thoại xuất bản của user hiện tên mới
- [ ] Yêu cầu xuất bản đang chờ của user đó hiện tên miền mới trong tab duyệt của admin
- [ ] User chưa từng xuất bản đổi tên miền → duyệt vẫn thành công (không đụng Vercel)

## 19. Ghi mọi yêu cầu vào file checklist

- [ ] File này có mục cho mọi yêu cầu đã gửi, và được cập nhật khi có yêu cầu mới

## 20. Xoá ảnh trong Storage làm hỏng trang đang dùng ảnh đó

Video hiện chỉ là link YouTube (không nằm trong Storage) nên không bị ảnh hưởng.

- [ ] Xuất bản trang có ảnh thường + ảnh trong hình khối + favicon → xem nguồn trang trên Vercel: ảnh trỏ tới `/assets/…`, không còn link `firebasestorage.googleapis.com`
- [ ] Xoá các ảnh đó trong Firebase Storage → web đã xuất bản **vẫn hiện đủ ảnh và favicon**
- [ ] Ảnh dán link ngoài (không phải Storage) giữ nguyên link gốc
- [ ] Trình soạn thảo: ảnh đã bị xoá hiện khung đỏ "Ảnh không còn tồn tại" (ảnh thường và ảnh trong hình khối)
- [ ] Bảng thuộc tính: phần xem trước ảnh báo "Ảnh không còn tồn tại" + nhắc tải ảnh khác; tải ảnh mới → hết cảnh báo
- [ ] Favicon bị xoá → mục Website báo "Icon đã bị xoá"
- [ ] Xem trước (không phải trình soạn thảo): ảnh bị xoá hiện ô trống, không hiện biểu tượng ảnh vỡ
- [ ] Admin duyệt trang có ảnh đã bị xoá → vẫn xuất bản được, thông báo "x ảnh không còn trong Storage nên đã bị bỏ trống"
- [ ] Đang có web cũ, duyệt trang mới mà tải ảnh lỗi (VD mất mạng) → web cũ **không** bị xoá
- [ ] Web xuất bản **trước** bản sửa này vẫn còn dùng link Storage → xuất bản lại để được đóng gói ảnh
