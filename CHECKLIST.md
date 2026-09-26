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

## 27. Nhóm "Chữ" riêng trong cột trái

- [ ] Cột trái: nhóm **"Chữ"** ở trên cùng; mục "Thành phần" không còn Tiêu đề / Đoạn văn (còn Nút bấm, Hình ảnh, Khối màu, Đường kẻ, Video)
- [ ] Nhóm Chữ có 8 kiểu, mỗi kiểu có icon: Tiêu đề lớn, Tiêu đề, Tiêu đề phụ, Đoạn văn, Trích dẫn, Danh sách, Chú thích, Nhãn
- [ ] Kéo thả **và** nhấp từng kiểu → tạo chữ đúng cỡ, độ đậm, màu và nội dung mẫu
  - Trích dẫn: chữ nghiêng, nền tím nhạt, bo góc
  - Danh sách: 3 dòng có dấu •
  - Nhãn: chữ nhỏ, in hoa, giãn chữ, màu tím
- [ ] Nhấp đúp để sửa chữ trực tiếp; mọi chỉnh sửa chữ/màu/phông ở bảng bên phải hoạt động như trước
- [ ] Bảng "Lớp" hiện nội dung chữ; bảng thuộc tính hiện "Tiêu đề" hoặc "Đoạn văn"
- [ ] Trang cũ có tiêu đề/đoạn văn vẫn mở và xuất bản bình thường
- [ ] Trang đã xuất bản hiện đúng các kiểu chữ

## 28. Nhóm "Nút bấm" riêng trong cột trái

- [ ] Cột trái: nhóm **"Nút bấm"** ngay dưới nhóm Chữ; mục "Thành phần" không còn ô Nút bấm
- [ ] Nhóm có 8 kiểu, mỗi ô có **nút mẫu thu nhỏ** đúng màu/viền/bo góc: Nút chính, Viền, Bo tròn, Nhạt, Chuyển màu, Nổi, Liên kết, Nút lớn
- [ ] Kéo thả **và** nhấp từng kiểu → tạo nút đúng kiểu
  - Chuyển màu: nền chuyển tím → hồng, bo tròn
  - Nổi: nền trắng, có bóng đổ
  - Liên kết: chữ gạch chân "Xem thêm →", không nền
  - Nút lớn: to hơn, chữ "Bắt đầu ngay"
- [ ] Sửa chữ, liên kết khi nhấn, "Mở trong tab mới", màu nền, viền, bo góc ở bảng bên phải hoạt động như trước
- [ ] Nút "Chuyển màu": ô Màu nền hiện chuỗi `linear-gradient(...)`, sửa được hoặc chọn màu trơn thay thế
- [ ] Xem trước / trang đã xuất bản: nút bấm được, mở đúng liên kết
- [ ] Trang cũ có nút bấm vẫn hiển thị và xuất bản bình thường

## 29. Nút icon trong nhóm Nút bấm

- [ ] Nhóm Nút bấm có thêm 2 ô: **"Nút icon"** (nền tím tròn, icon trắng) và **"Icon"** (không nền, icon tím); ô mẫu hiện đúng icon
- [ ] Kéo thả / nhấp để thêm → nút icon trên trang
- [ ] Bảng thuộc tính → "Icon": lưới chọn icon chia theo nhóm (xem mục 30); icon đang chọn được tô sáng
- [ ] Chọn icon khác → đổi ngay trên trang
- [ ] "Màu icon" đổi màu; "Cỡ icon" (20–100%) và "Độ dày nét" hoạt động
- [ ] Nền, bo góc, viền, bóng, độ mờ, xoay, đổi cỡ dùng như phần tử khác
- [ ] "Khi bấm": nhập đường dẫn (https://, `tel:`, `mailto:`), "Mở trong tab mới", "Mô tả"
- [ ] Trang chỉnh sửa: bấm vào nút icon chỉ chọn phần tử, không mở liên kết
- [ ] Xem trước / trang đã xuất bản: bấm vào icon mở đúng đường dẫn (tab mới nếu bật); `tel:` gọi điện trên điện thoại
- [ ] Rê chuột lên icon ở trang đã xuất bản → hiện tên (Mô tả, hoặc tên icon nếu để trống)
- [ ] Bảng "Lớp" hiện "Nút icon" với biểu tượng ngôi sao

## 30. Thêm nhiều icon (99 icon, 7 nhóm) + tìm icon

- [ ] Bảng chọn icon có 7 nhóm: Mạng xã hội (12), Liên hệ (14), Mua sắm (12), Đời sống (13), Đa phương tiện (8), Chung (30), Mũi tên (10)
- [ ] Icon mạng xã hội mới: Zalo, Messenger, WhatsApp, Telegram, Pinterest, GitHub
- [ ] Ô "Tìm trong 99 icon…": gõ có dấu hoặc không dấu đều tìm được (VD "dien thoai", "giao hang", "zalo")
- [ ] Đang tìm: chỉ hiện các nhóm có kết quả; không có kết quả → "Không tìm thấy icon nào"
- [ ] Chọn một icon mới → đổi ngay trên trang; trang đã xuất bản hiện đúng icon đó
- [ ] Nút icon tạo trước khi thêm icon mới vẫn giữ nguyên icon cũ

## 31. Mọi ô màu chọn được Đơn sắc hoặc Chuyển màu (gradient)

Ô màu nào cũng có 2 nút **Đơn sắc / Chuyển màu** (trừ Màu 1/Màu 2 của Âm thanh, vốn đã là chuyển màu giữa 2 màu).

- [ ] Chuyển màu: thanh xem trước, 8 mẫu có sẵn, Tuyến tính / Toả tròn, thanh chỉnh góc (tuyến tính), 2–5 điểm màu (đổi màu, kéo vị trí, xoá, "Thêm điểm màu")
- [ ] Bấm "Đơn sắc" khi đang chuyển màu → giữ màu của điểm đầu tiên
- [ ] Kéo thanh góc / vị trí liên tục rồi Ctrl+Z → hoàn tác cả lần kéo, không phải từng bước nhỏ
- [ ] Áp dụng và hiển thị đúng (trang chỉnh sửa, Xem trước, ảnh thu nhỏ trang chủ, trang **đã xuất bản**) cho:
  - [ ] Màu nền trang
  - [ ] Màu nền phần tử (chữ, nút, ảnh, khối màu, video, nút icon, âm thanh)
  - [ ] Màu chữ (tiêu đề, đoạn văn, nút) — gạch chân vẫn thấy được
  - [ ] Màu viền — viền gradient vẫn bo góc đúng, kể cả nút bo tròn
  - [ ] Đường kẻ — cả nét liền, nét đứt, chấm
  - [ ] Hình khối: màu nền (khi không có ảnh) và màu viền/viền giấy
  - [ ] Màu icon của nút icon (kể cả icon có chấm nhỏ như Instagram)
- [ ] Đang sửa chữ trực tiếp (nhấp đúp) trên chữ gradient → tạm hiện màu đầu tiên; sửa xong hiện lại gradient
- [ ] Nút "Chuyển màu" có sẵn trong nhóm Nút bấm mở ra đúng chế độ Chuyển màu
- [ ] Trang cũ (màu đơn sắc) không bị thay đổi gì

## 32. Các nhóm ở cột trái thu gọn, có nút phóng to xem đủ

- [ ] Mặc định mỗi nhóm (Chữ, Nút bấm, Thành phần, Hình khối, Âm thanh) chỉ hiện **2 phần tử đầu**, cạnh tên nhóm có số lượng (VD "NÚT BẤM 10")
- [ ] Nút ⛶ cạnh tên nhóm **hoặc** liên kết "Xem tất cả n" → mở rộng nhóm, hiện đủ phần tử (lưới 3 cột) và dòng gợi ý của nhóm
- [ ] Bấm lại nút (đổi thành biểu tượng thu gọn) → thu về 2 phần tử
- [ ] Mở/thu từng nhóm độc lập với nhau
- [ ] Tải lại trang / mở trang khác → các nhóm vẫn giữ trạng thái mở/thu như lần trước (trên cùng trình duyệt)
- [ ] Kéo thả và nhấp để thêm vẫn hoạt động ở cả 2 trạng thái

## 33. Tự dọn ảnh/âm thanh không còn dùng trong Storage

Tệp "thừa" = tệp trong `users/{uid}/images` hoặc `users/{uid}/audio` mà không thiết kế nào của user, không yêu cầu xuất bản đang chờ/đang triển khai nào, và không mẫu trang nào dùng. Tệp chỉ bị xoá khi đã thừa **liên tục hơn 24 giờ**.

- [ ] Tải ảnh lên thiết kế rồi xoá phần tử ảnh → về trang chủ: ảnh **chưa** bị xoá ngay (Firestore có `storageCleanups/user_<uid>` ghi nhận tệp chờ)
- [ ] Sau hơn 24 giờ, về trang chủ lần nữa (hoặc admin bấm "Dọn dung lượng") → ảnh bị xoá khỏi Storage
- [ ] Xoá ảnh rồi Ctrl+Z trong vòng 24 giờ → ảnh vẫn còn, không bị xoá (vì lại được dùng)
- [ ] Ảnh/âm thanh vẫn còn trong **bất kỳ** thiết kế nào của user → không bị xoá
- [ ] Ảnh nằm trong yêu cầu xuất bản đang chờ duyệt (dù đã bị xoá khỏi thiết kế) → không bị xoá; admin duyệt vẫn đủ ảnh
- [ ] Xoá cả một trang → sau 24 giờ các ảnh chỉ trang đó dùng bị dọn
- [ ] Favicon và ảnh trong hình khối cũng được tính là "đang dùng"
- [ ] Trang đã xuất bản (sau mục 20) vẫn đủ ảnh sau khi ảnh gốc bị dọn
- [ ] Trang quản trị → nút **"Dọn dung lượng"** → hỏi xác nhận → báo số tệp đã xoá, dung lượng giải phóng, số tệp còn chờ
- [ ] Xoá một mẫu trang → sau 24 giờ, "Dọn dung lượng" xoá ảnh trong `templates/images` mà không mẫu nào dùng
- [ ] Về trang chủ liên tục → backend chỉ dọn tối đa 1 lần/phút cho mỗi user
- [ ] Tắt backend → trang chủ vẫn dùng bình thường (chỉ ghi cảnh báo trong console)

## 34. Hiệu ứng khi đang tải ảnh / âm thanh lên

- [ ] Kéo thả tệp ảnh vào chỗ trống trên trang → ngay tại chỗ thả hiện **khung chờ** (nền tím, viền đứt, ánh sáng chạy qua) với vòng xoay "Đang xử lý…" rồi "Đang tải lên x%"; xong thì khung được thay bằng ảnh
- [ ] Thả nhiều ảnh một lúc → mỗi ảnh có khung chờ riêng (xếp lệch nhau), tải song song, ảnh nào xong trước hiện trước
- [ ] Thả ảnh lên hình khối → lớp phủ tối + vòng tiến trình **trên chính hình khối** đó
- [ ] Bảng thuộc tính: "Tải ảnh lên / Đổi ảnh" (ảnh, hình khối), "Tải tệp lên" (âm thanh), "Tải icon lên" (favicon) → chữ nút đổi thành "Đang xử lý…" / "Đang tải lên x%", thanh tiến trình chạy dưới đáy nút, nút bị khoá trong lúc tải
- [ ] Tải ảnh/âm thanh qua bảng thuộc tính → phần tử tương ứng trên trang cũng hiện lớp phủ tiến trình
- [ ] Vòng tiến trình và chữ giữ nguyên kích thước dù phóng to/thu nhỏ trang
- [ ] Phần tử đang tải đã xoay → lớp phủ xoay theo
- [ ] Tải lỗi (VD mất mạng) → khung chờ / lớp phủ biến mất, có thông báo lỗi
- [ ] Tệp lớn (âm thanh ~10–20MB): phần trăm tăng dần, không đứng yên

## 35. Hiệu ứng âm thanh nhảy theo nhịp nhạc thật

Nguyên nhân cũ: bucket Storage chưa bật CORS nên trong trang chỉnh sửa/xem trước trình duyệt không đọc được dữ liệu nhạc → hiệu ứng chạy giả lập. **Đã bật** CORS (chỉ đọc, mọi nguồn) cho bucket `nayva-e79e1.firebasestorage.app` bằng `npm run setup:cors` ở backend; project Firebase mới cần chạy lại lệnh này một lần.

- [ ] Đã chạy `npm run setup:cors`; lệnh in ra cấu hình CORS của bucket với đúng tên miền frontend
- [ ] Trang chỉnh sửa: phát nhạc có trống rõ → các thanh nảy lên **đúng mỗi phách**, hạ nhanh giữa các phách; không có nhãn "Mô phỏng"
- [ ] Nhạc nhỏ tiếng vẫn nhảy cao (tự cân độ lớn)
- [ ] Vòng tròn: vòng phình theo phách; Nhịp đập: khối giữa đập theo tiếng trống
- [ ] Đoạn nhạc lặng → các thanh hạ thấp, không nhảy loạn
- [ ] Chưa bật CORS (hoặc tệp ở máy chủ khác chặn): nhạc vẫn phát, hiệu ứng chạy nhịp giả lập 120 bpm, và **trong trang chỉnh sửa** có nhãn "Mô phỏng" ở góc (rê chuột thấy giải thích); trang đã xuất bản không có nhãn này
- [ ] Trang đã xuất bản: nhảy đúng nhịp nhạc (tệp nằm cùng tên miền nên không cần CORS)

## 36. Sóng âm khác nhau theo nhạc thật (đã bật CORS cho bucket)

- [ ] Tải lại hẳn trang chỉnh sửa (Ctrl+F5) → phát nhạc: hình sóng **khác nhau theo từng đoạn** của bài (đoạn lặng thấp, đoạn trống/điệp khúc cao), không lặp lại một mẫu
- [ ] Hai bài nhạc khác nhau cho hình sóng khác nhau
- [ ] Web đã xuất bản từ trước (còn dùng link Storage) cũng nhảy theo nhạc thật

## 37. Hạn mức 100MB tải lên mỗi user + thanh dung lượng + quản lý tệp

Cần deploy: backend, **Storage rules** và **Firestore rules** (`firebase deploy --only firestore:rules,storage`).

- [ ] Trang chỉnh sửa: cuối cột trái có thanh "x MB / 100 MB" (luôn dính ở đáy); trang chủ: thanh nổi ở góc trái dưới
- [ ] Thanh chuyển màu cam khi dùng ≥ 70%, đỏ khi ≥ 90%
- [ ] Tải ảnh/âm thanh/favicon lên → con số tăng ngay
- [ ] Bấm thanh → bảng "Dung lượng đã dùng": tổng dung lượng, % và số tệp; danh sách tệp có ảnh thu nhỏ / icon âm thanh, **tên tệp gốc** (tệp tải trước khi có tính năng này hiện tên tự sinh), dung lượng, ngày tải lên
- [ ] Mỗi tệp ghi rõ "Đang dùng: <tên trang>", "Trong yêu cầu xuất bản đang chờ duyệt" hoặc "Không dùng ở trang nào"
- [ ] Lọc Tất cả / Ảnh / Âm thanh / Không dùng; sắp xếp Mới nhất / Lớn nhất; nút mở tệp
- [ ] Xoá một tệp không dùng → biến mất khỏi danh sách, dung lượng giảm, tệp mất khỏi Storage
- [ ] Xoá tệp đang dùng → hỏi xác nhận, nêu tên các trang dùng nó; sau khi xoá trang đó báo "Ảnh không còn tồn tại"
- [ ] "Xoá n tệp không dùng" xoá hết tệp không dùng một lần (không đụng tệp trong yêu cầu xuất bản đang chờ)
- [ ] Dùng gần hết 100MB → tải thêm tệp làm vượt hạn mức bị chặn với thông báo "Bạn đã dùng hết 100 MB…" (ở bảng thuộc tính và khi thả tệp vào trang)
- [ ] Cố tải thẳng lên Storage bằng SDK khi đã vượt hạn mức → bị Storage rules từ chối
- [ ] Ảnh admin chép sang mẫu trang (`templates/images`) **không** bị tính vào hạn mức của admin
- [ ] Dọn tệp thừa tự động (mục 33) cũng làm dung lượng giảm tương ứng
- [ ] Không xoá được tệp của người khác (gọi API với đường dẫn tệp user khác → 403)

## 38. Chọn nhiều tệp để xoá cùng lúc trong bảng dung lượng

- [ ] Mỗi tệp có ô chọn ở đầu; tệp được chọn có viền/nền tím nhạt
- [ ] "Chọn tất cả" chọn/bỏ chọn **các tệp đang hiển thị** (theo bộ lọc Ảnh / Âm thanh / Không dùng); chọn một phần thì ô hiện dấu "−"
- [ ] Có tệp được chọn → hiện nút đỏ "Xoá n tệp đã chọn (dung lượng)" và "Bỏ chọn"; nút "Xoá n tệp không dùng" tạm ẩn
- [ ] Chọn cả tệp đang dùng → hộp xác nhận nêu tên các trang bị ảnh hưởng
- [ ] Xoá nhiều tệp → chỉ 1 lần gọi máy chủ, danh sách và dung lượng cập nhật ngay, lựa chọn được xoá sạch
- [ ] Đổi bộ lọc không làm mất các tệp đã chọn trước đó
- [ ] Không xoá được tệp của người khác / ngoài thư mục ảnh-âm thanh (API trả 403)

## 39. Chèn video vào hình khối (ngoài ảnh)

Cần deploy: backend + Storage rules (thư mục `users/{uid}/videos`).

- [ ] Chọn một hình khối → bảng "Ảnh / video trong hình" có nút chuyển **Ảnh | Video**
- [ ] Chọn Video → "Tải video lên" (MP4/WebM/MOV, tối đa 30MB): có tiến trình tải lên trên nút và trên hình
- [ ] Video trong hình: tự phát, **tắt tiếng**, lặp lại, bị cắt đúng theo hình (tim, sao, tròn, giấy rách, …)
- [ ] Viền hình, vân giấy, đổ bóng vẫn hiện quanh hình có video
- [ ] Nhấp đúp vào hình có video (hoặc "Kéo video trực tiếp trên trang") → kéo để dời, cuộn chuột để phóng; toàn khung video hiện mờ phía sau khi đang chỉnh; các thanh Ngang / Dọc / Thu phóng và "Đặt lại vị trí video" hoạt động
- [ ] Hình khối đã xoay chứa video → video xoay theo, vẫn cắt đúng
- [ ] Dán đường dẫn video (link .mp4 trực tiếp) → phát trong hình
- [ ] "Bỏ video" → hình trở lại màu nền; chuyển Ảnh ↔ Video làm trống hình (tệp cũ không hợp kiểu mới)
- [ ] Kéo thả tệp video từ máy **lên một hình khối** → video vào hình đó; thả video ra chỗ trống → thông báo "Thả video vào một hình khối…"
- [ ] Tệp > 30MB hoặc làm vượt hạn mức 100MB → bị chặn với thông báo rõ ràng
- [ ] Bảng dung lượng: có bộ lọc "Video", video hiện icon video, tính vào dung lượng, xoá được
- [ ] Xoá video khỏi Storage → trong trang chỉnh sửa hình báo "Video không còn tồn tại"
- [ ] Ảnh thu nhỏ ở trang chủ: video đứng yên (không tự phát)
- [ ] Xem trước và trang **đã xuất bản**: video phát trong hình; tệp video nằm trong `/assets/…` của Vercel (xoá khỏi Storage vẫn phát)
- [ ] Trên điện thoại (iOS Safari): video tự phát trong hình (vì đã tắt tiếng + playsinline)
- [ ] Dọn tệp thừa (mục 33) cũng xoá video không còn dùng sau 24 giờ
- [ ] Admin "Lưu làm mẫu" trang có video trong hình → mẫu vẫn phát video

## 40. Mẫu portfolio đầy đủ (nhiều phần, cuộn dọc)

Đã ghi vào Firestore bằng `npm run seed:templates` ở backend (chạy lại chỉ cập nhật, không tạo trùng; `-- --preview <thư mục>` để xem trước HTML mà không ghi). Hai mẫu một-màn-hình cũ ("Tối giản", "Link in bio") đã được gỡ.

- [ ] Trang chủ → "Tạo trang mới" có 4 mẫu: **Portfolio – Nhà thiết kế** (nền tối), **Portfolio – Lập trình viên** (nền sáng), **Portfolio – Nhiếp ảnh**, **Portfolio – Sáng tạo nội dung** (tông cam)
- [ ] Mỗi mẫu có đủ các phần: thanh menu, phần mở đầu, giới thiệu/con số, dịch vụ hoặc kỹ năng, dự án/tác phẩm, kinh nghiệm hoặc bảng giá, cảm nhận khách hàng, liên hệ, chân trang
- [ ] Tạo trang từ từng mẫu → mở đúng bố cục, cuộn hết trang không có chỗ chồng chéo
- [ ] Sửa được mọi thứ: chữ, màu/gradient, ảnh (ảnh thường và ảnh trong hình khối), nút + đường dẫn, icon mạng xã hội
- [ ] Các nút liên hệ mở đúng `mailto:` / `tel:`; nút GitHub mở tab mới
- [ ] Ảnh minh hoạ là ảnh mẫu từ picsum.photos → thay bằng ảnh của mình; tên/email/số điện thoại là dữ liệu giả
- [ ] Xuất bản một trang tạo từ mẫu → hiển thị giống trong trình soạn thảo, thu nhỏ vừa màn hình điện thoại
- [ ] Admin xoá được các mẫu này ở tab "Mẫu đã tạo"

## 41. Duyệt xuất bản báo "Vercel: Not authorized"

Nguyên nhân: token Vercel của backend hết hạn / bị thu hồi (Vercel trả `invalidToken: true` cho mọi lệnh gọi).

- [ ] Đã tạo token mới trên Vercel (Account Settings → Tokens), đúng phạm vi team chứa các project, hạn dùng đủ dài
- [ ] Đã cập nhật `VERCEL_TOKEN` (và `VERCEL_TEAM_ID` nếu project thuộc team) ở `.env` **và** ở biến môi trường nơi backend đang chạy, rồi deploy lại backend
- [ ] Bấm "Duyệt" lại yêu cầu đang chờ → xuất bản thành công
- [ ] Khi token hỏng, dòng lỗi trong tab duyệt ghi rõ "Token Vercel (VERCEL_TOKEN) không hợp lệ hoặc đã hết hạn…" thay vì "Not authorized"
