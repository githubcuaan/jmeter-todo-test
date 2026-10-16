# Todo REST API

NestJS API with validated JSON payloads and in-memory storage. Todos are lost
when the server restarts. No database or authentication is configured.

## Run

```bash
npm install
npm run start:dev
```

Default URL: `http://localhost:3000`. Set `PORT` to change the port.

## Endpoints

| Method | Path | Result |
| --- | --- | --- |
| POST | `/todos` | Create a todo (201) |
| GET | `/todos` | List todos (200) |
| GET | `/todos?completed=true` | Filter by completion (`true` or `false`) |
| GET | `/todos/:id` | Read a todo (200) |
| PATCH | `/todos/:id` | Update title and/or completion (200) |
| DELETE | `/todos/:id` | Delete a todo (204, no body) |

Create requires `title`: a string, trimmed, 1–200 characters. Optional
`completed` must be a boolean; defaults to `false`. PATCH accepts either field;
an empty object is allowed. Null values and unknown fields are rejected (400).
IDs must be UUID v4 (400 for invalid IDs, 404 for missing todos).

```bash
curl -X POST http://localhost:3000/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy milk"}'

curl http://localhost:3000/todos

curl -X PATCH http://localhost:3000/todos/REPLACE_WITH_ID \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

curl -X DELETE http://localhost:3000/todos/REPLACE_WITH_ID
```

Responses include `id`, `title`, `completed`, `createdAt`, and `updatedAt`.
Timestamps are ISO 8601 strings. Lists return JSON arrays.

## Verify

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npx eslint "{src,test}/**/*.ts"
```

## JMeter testing

Install Apache JMeter 5.6.3 and a compatible Java runtime; put `jmeter` on PATH.
Start the API with `npm run start:dev` in another terminal.

Smoke test (one user, one CRUD cycle):

```bash
jmeter -n -t test/jmeter/todos.jmx -l /tmp/opencode/todos-smoke.jtl
```

Load test (10 users, 20 cycles each, 5-second ramp-up):

```bash
jmeter -n -t test/jmeter/todos.jmx \
  -Jhost=localhost -Jport=3000 -Jusers=10 -Jloops=20 -Jramp=5 \
  -l /tmp/opencode/todos-load.jtl -e -o /tmp/opencode/todos-report
```

Use fresh results/report paths for every run. Open the generated report's
`index.html`; inspect error percentage, throughput, and response-time percentiles.
JMeter can exit successfully even with failed samples: check that error count is
zero. No latency threshold is enforced by this plan.

Each cycle creates, reads, completes, lists, deletes, and verifies deletion of
its own todo. Assertions check status codes and JSON values; expected 404 after
deletion counts as success. Threads stop on failure, so failed cycles can leave
todos behind. Restart the API to clear in-memory data before a fresh benchmark.
Run load tests only against an authorized test environment.

For GUI inspection: `jmeter -t test/jmeter/todos.jmx`. Add a View Results Tree
listener for debugging only; use non-GUI mode for load measurements.

## Báo cáo kiểm thử tải bằng JMeter

### Môi trường và cấu hình

- Thời điểm: 16/10/2026, 08:28:35–08:28:39 (GMT+07:00).
- Đích kiểm thử: API đang chạy tại `http://localhost:3000`.
- Công cụ: Apache JMeter, chế độ dòng lệnh; OpenJDK 27, Linux.
- API và JMeter chạy trên cùng máy; dữ liệu lưu trong bộ nhớ, không có database.
- 10 người dùng ảo, tăng tải trong 5 giây, mỗi người chạy 20 vòng.
- Mỗi vòng gồm 6 yêu cầu tuần tự, không có thời gian nghỉ: tạo → đọc →
  hoàn thành → lọc danh sách đã hoàn thành → xóa → xác nhận đã xóa.
- Tổng dự kiến: 200 vòng, 1.200 yêu cầu. Không đặt ngưỡng thời gian phản hồi.
- Không khởi động lại API hoặc xóa dữ liệu có sẵn trước lần chạy này.

### Lệnh thực thi

Đặt Java theo bản đang cài để tránh `JAVA_HOME` trỏ tới thư mục không tồn tại:

```bash
export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"
export JRE_HOME="$JAVA_HOME"

jmeter -n -t test/jmeter/todos.jmx \
  -Jhost=localhost -Jport=3000 -Jusers=10 -Jloops=20 -Jramp=5 \
  -l /tmp/opencode/todos-load-20261016-run1.jtl \
  -j /tmp/opencode/todos-load-20261016-run1.log \
  -e -o /tmp/opencode/todos-report-20261016-run1
```

Đổi tên tệp kết quả và thư mục báo cáo khi chạy lại, không ghi chồng kết quả cũ.

### Kết quả thực tế

Số liệu dưới đây lấy từ `statistics.json` trong báo cáo HTML. Đơn vị thời gian:
miligiây (ms); P95 là phân vị 95% thời gian phản hồi.

| Thao tác | Số yêu cầu | Lỗi | Trung bình (ms) | P95 (ms) | Lớn nhất (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Tạo todo | 200 | 0 | 1,455 | 3 | 31 |
| Đọc todo | 200 | 0 | 1,045 | 2 | 5 |
| Cập nhật hoàn thành | 200 | 0 | 1,295 | 3 | 9 |
| Lọc todo đã hoàn thành | 200 | 0 | 1,055 | 3 | 4 |
| Xóa todo | 200 | 0 | 0,985 | 2 | 5 |
| Xác nhận đã xóa (404 mong đợi) | 200 | 0 | 0,960 | 2 | 4 |
| **Tổng** | **1.200** | **0** | **1,133** | **3** | **31** |

- Tỷ lệ lỗi: **0%**, toàn bộ 200 vòng hoàn tất.
- Trung vị: **1 ms**; P90: **2 ms**; P99: **4 ms**.
- Thông lượng theo báo cáo HTML: **264,84 yêu cầu/giây**.
- Console ghi nhận khoảng **5 giây**, thông lượng **259,4 yêu cầu/giây**;
  chênh lệch do cửa sổ thời gian tổng hợp của console và báo cáo khác nhau.
- Assertion kiểm tra mã HTTP và nội dung JSON; mã 404 sau khi xóa là kết quả
  đúng, không tính là lỗi.

### Đánh giá và giới hạn

Kịch bản CRUD và lọc danh sách đạt yêu cầu chức năng trong lần chạy này, không
ghi nhận yêu cầu hoặc assertion thất bại. Thời gian phản hồi thấp trong điều
kiện kiểm thử cục bộ, dữ liệu trong bộ nhớ.

Đây là lần kiểm thử ngắn, không phải kiểm thử độ bền hoặc xác định tải tối đa.
10 người dùng được tăng dần và có thể kết thúc trước khi tất cả cùng hoạt động;
không thể coi kết quả là tải ổn định với 10 người dùng đồng thời. Chưa đánh giá
CPU/RAM, database, mạng thực tế, xác thực hoặc giới hạn hiệu năng production.
Giá trị 0 ms trong dữ liệu gốc là giới hạn độ phân giải đo, không có nghĩa API
xử lý tức thời. JMeter phát cảnh báo tương thích API Java cũ nhưng vẫn hoàn tất
chạy thử và tạo báo cáo.

### Tệp báo cáo

- Dữ liệu từng yêu cầu: `/tmp/opencode/todos-load-20261016-run1.jtl`.
- Nhật ký JMeter: `/tmp/opencode/todos-load-20261016-run1.log`.
- Báo cáo HTML: `/tmp/opencode/todos-report-20261016-run1/index.html`.

Mở tệp HTML bằng trình duyệt để xem biểu đồ. Các tệp trên nằm ngoài repository,
trong thư mục tạm; cần sao lưu riêng nếu muốn lưu giữ lâu dài.
