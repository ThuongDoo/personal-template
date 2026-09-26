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
- [ ] Đang có 1 yêu cầu chờ duyệt (kể cả của trang khác) → không gửi thêm được (xem mục 21)
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

## 21. Chặn nhiều yêu cầu xuất bản cùng lúc (mỗi user chỉ 1 web)

- [ ] Trang A đang chờ duyệt → mở trang B, hộp thoại xuất bản báo "Trang A đang chờ duyệt xuất bản", nút gửi bị khoá
- [ ] Huỷ yêu cầu của A → gửi được yêu cầu cho B
- [ ] Gửi yêu cầu cho A và B gần như cùng lúc (2 tab) → chỉ một yêu cầu được nhận, tab kia báo lỗi
- [ ] Gọi thẳng API gửi yêu cầu cho B khi A đang chờ → 409
- [ ] Trang A đang triển khai (admin vừa duyệt) → B cũng bị chặn cho tới khi xong
- [ ] Hai admin duyệt 2 thao tác của **cùng một user** cùng lúc (VD: xuất bản + đổi tên miền) → một bên chạy, bên kia báo "Trang web của người dùng này đang được cập nhật", thử lại sau thì được
- [ ] Sau các thao tác trên: Vercel chỉ có **1 project** cho user đó, tên miền trỏ đúng trang, nhãn "Đang xuất bản" ở trang chủ đúng trang
- [ ] Admin duyệt thao tác của 2 user **khác nhau** cùng lúc → cả hai chạy bình thường

## 22. Xoay các phần tử trong trang chỉnh sửa

- [ ] Chọn phần tử → có nút tròn phía trên khung chọn; kéo để xoay quanh tâm
- [ ] Giữ **Shift** khi xoay → nhảy từng 15°
- [ ] Bật nam châm: xoay gần 0°/45°/90°… tự hít vào; giữ **Alt** để tắt hít
- [ ] Nhấp đúp nút xoay → về 0°
- [ ] Nhãn kích thước hiện góc, VD "300 × 200 · 30°"
- [ ] Bảng thuộc tính → "Góc xoay": nhập số, nút xoay trái/phải 90°, nút "0°"
- [ ] Nhập 190° → tự thành -170°
- [ ] Xoay được mọi loại: tiêu đề, đoạn văn, nút, ảnh, khối màu, đường kẻ, video, hình khối
- [ ] Phần tử khoá: không có nút xoay
- [ ] Đổi cỡ phần tử đã xoay (kéo cạnh và góc): cạnh/góc đối diện đứng yên; Shift + góc giữ tỉ lệ
- [ ] Di chuyển phần tử đã xoay: đường gióng bám theo mép **nhìn thấy** của phần tử
- [ ] Sửa chữ trực tiếp (nhấp đúp) trên phần tử đã xoay vẫn được
- [ ] Hình khối có ảnh, đã xoay: kéo ảnh (crop) di chuyển đúng hướng; cuộn chuột phóng quanh con trỏ
- [ ] Thả tệp ảnh lên hình khối đã xoay → ảnh vào đúng hình (kể cả ở góc bị xoay ra ngoài khung cũ)
- [ ] Hoàn tác (Ctrl+Z): cả một lần kéo xoay là 1 bước
- [ ] Nhân bản / sao chép-dán giữ nguyên góc xoay
- [ ] Xem trước, ảnh thu nhỏ ở trang chủ, và trang **đã xuất bản** trên Vercel đều hiện đúng góc xoay
- [ ] Trang cũ (tạo trước khi có tính năng xoay) mở bình thường, không bị xoay

## 23. Phần tử Âm thanh với hiệu ứng nhảy theo nhạc

Cần deploy lại Storage rules (thêm thư mục `audio`). Để hiệu ứng trong **trình soạn thảo/xem trước** nhảy theo đúng nhạc, bucket cần cấu hình CORS (`cors.json`, như mục 7); thiếu CORS thì vẫn phát được nhưng hiệu ứng chạy theo mẫu giả lập.

- [ ] Cột trái có nhóm "Âm thanh" (xem mục 24); kéo/nhấp một kiểu để thêm → khung tối "Tải tệp âm thanh ở bảng bên phải"
- [ ] Tải lên MP3 / M4A / WAV / OGG → tên tệp hiện trong bảng; tệp nằm ở Storage `users/{uid}/audio/`
- [ ] Tệp không phải âm thanh hoặc > 20MB → báo lỗi, không tải lên
- [ ] "Đổi tệp", "Bỏ tệp" hoạt động
- [ ] Bấm nút ▶ ngay trên trang soạn thảo → phát được, **không** kéo/di chuyển phần tử; bấm lại để dừng
- [ ] Đổi kiểu hiệu ứng, Màu 1/Màu 2, Số thanh ở bảng bên phải → cập nhật ngay
- [ ] Khi phát: hiệu ứng nhảy theo nhạc (nhịp trống làm các thanh bên trái vọt lên); khi dừng: từ từ lắng xuống
- [ ] "Phát lặp lại": hết bài tự phát lại
- [ ] Hai phần tử âm thanh trên cùng trang: phát cái này thì cái kia tự dừng
- [ ] Đổi cỡ / xoay / đổi màu nền / bo góc phần tử âm thanh → hiệu ứng vẽ lại đúng, không bị mờ khi zoom
- [ ] Xem trước: phát được, hiệu ứng chạy
- [ ] Trang **đã xuất bản**: phát được, hiệu ứng nhảy theo nhạc; tệp âm thanh nằm trong `/assets/…` của Vercel (xoá khỏi Storage vẫn nghe được)
- [ ] Trình duyệt điện thoại (iOS Safari, Android Chrome) phát được trên trang đã xuất bản
- [ ] Xoá tệp âm thanh khỏi Storage → trong trình soạn thảo nút phát mờ đi, rê chuột báo "Không phát được"
- [ ] Admin "Lưu làm mẫu" một trang có âm thanh → mẫu phát được
- [ ] Trang không có âm thanh → HTML xuất bản không chứa đoạn script âm thanh

## 24. Âm thanh là một nhóm (như Hình khối) với nhiều kiểu

- [ ] Cột trái: mục "Thành phần" không còn ô Âm thanh; có nhóm riêng **"Âm thanh"** dưới "Hình khối"
- [ ] Nhóm có 7 ô, mỗi ô có icon riêng: Cột sóng, Đối xứng, Sóng, Đèn LED, Bong bóng, Vòng tròn, Nhịp đập
- [ ] Kéo thả **và** nhấp từng ô → tạo phần tử đúng kiểu, đúng màu và kích thước riêng (Vòng tròn / Nhịp đập là khung vuông)
- [ ] Phát nhạc: cả 7 kiểu đều nhảy theo nhạc
  - Đèn LED: các ô sáng dần từ dưới lên, màu chuyển từ Màu 1 (dưới) sang Màu 2 (trên)
  - Bong bóng: các chấm tròn phồng lên theo nhạc
  - Nhịp đập: khối tròn giữa co giãn theo tiếng trầm, viền ngoài uốn theo nhạc
- [ ] Vòng tròn / Nhịp đập: nút phát nằm giữa; các kiểu khác: nút ở góc dưới trái và hiệu ứng không đè lên nút
- [ ] Bảng thuộc tính: tiêu đề hiện "Âm thanh · <tên kiểu>"; ô "Kiểu" là danh sách chọn đủ 7 kiểu
- [ ] Bảng "Lớp" và bảng thuộc tính hiện đúng tên kiểu
- [ ] Phần tử âm thanh tạo từ mục 23 (trước khi có nhóm) vẫn mở và phát bình thường
- [ ] Trang đã xuất bản hiện đúng cả 7 kiểu

## 25. Màu nền mặc định của âm thanh là trong suốt

- [ ] Thêm phần tử âm thanh mới (mọi kiểu) → không có nền, thấy nền trang phía sau; ô "Màu nền" trong bảng thuộc tính là `transparent`
- [ ] Chưa có tệp: khung chờ màu sáng "Âm thanh – Tải tệp âm thanh ở bảng bên phải"
- [ ] Trên nền trang trắng: hiệu ứng và nút phát vẫn nhìn rõ
- [ ] Vẫn đổi được sang màu nền khác như trước
- [ ] Phần tử âm thanh tạo **trước** thay đổi này giữ nguyên nền tối đã lưu

## 26. Bật/tắt tự động phát âm thanh (mặc định bật)

- [ ] Phần tử âm thanh mới: bảng thuộc tính có "Tự động phát khi mở trang", **đã bật sẵn**
- [ ] Trang chỉnh sửa: **không** tự phát (kể cả khi bật)
- [ ] Xem trước / trang đã xuất bản, khi trình duyệt cho phép: nhạc tự phát ngay khi mở
- [ ] Khi trình duyệt chặn (thường gặp ở lần đầu vào trang): nhạc tự bắt đầu ở lần **chạm/nhấp/gõ phím đầu tiên** vào bất kỳ chỗ nào trên trang
- [ ] Lần tương tác đầu tiên là bấm nút phát của chính phần tử đó → phát (không bị phát rồi dừng ngay)
- [ ] Trang có nhiều âm thanh cùng bật tự động phát → chỉ **cái đầu tiên** tự phát
- [ ] Tắt tự động phát → chỉ phát khi bấm nút
- [ ] Khi tự phát trước lúc người xem tương tác: nhạc có tiếng, hiệu ứng chạy theo mẫu; sau lần chạm đầu tiên hiệu ứng bám đúng theo nhạc
- [ ] Điện thoại (iOS Safari / Android Chrome): chạm lần đầu vào trang thì nhạc bắt đầu
- [ ] Phần tử âm thanh tạo trước thay đổi này cũng mặc định tự phát
