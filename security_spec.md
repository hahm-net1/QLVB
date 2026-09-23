# Security Specification for VNPT Technical Tasks App

## 1. Data Invariants
- Each Task document represents a technical dispatch task with strict schema validation.
- Fields `id`, `docNumber`, `title`, `dueDate`, `assignee`, `priority`, and `status` must be present and validated for type and bounded size.
- Status must belong to the allowed enum set: ['Đang thực hiện', 'Hoàn thành', 'Tạm dừng', 'Chờ duyệt'].
- Priority must belong to the allowed enum set: ['Bình thường', 'Quan trọng', 'Khẩn cấp'].
- Progress percent must be a number between 0 and 100.
- Notes array cannot exceed 200 items.

## 2. Access Control Model
- Public real-time sync across devices: All authenticated or authorized team members can read tasks across their phone and computer.
- Secure field boundary checking prevents payload poisoning or oversized writes.
