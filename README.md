# 💎 Jejak Keinginan

Aplikasi pelacak daftar keinginan yang modern, berperforma tinggi, dan memiliki desain visual yang menawan. Dibangun menggunakan Vanilla JS dan CSS untuk membantu Anda melacak target finansial, mengelola daftar keinginan, dan langsung melihat barang mana yang bisa dibeli berdasarkan budget Anda saat ini.

![Tampilan Aplikasi](https://via.placeholder.com/800x450.png?text=Jejak+Keinginan)

## ✨ Fitur Utama

-   **🎨 UI/UX Premium**: Desain *dark mode* yang elegan dengan efek *glassmorphism* dan micro-animation yang halus.
-   **💰 Pencocokan Budget Dinamis**: Kalkulasi real-time untuk menentukan barang mana yang terjangkau berdasarkan budget/nominal Anda (Maksimal Rp 10 Miliyar).
-   **✅ Validasi Cerdas**: Mencegah penambahan data yang tidak lengkap (wajib isi Nama jika Harga terisi, dan sebaliknya) dengan efek visual *shake*.
-   **🇮🇩 Format Mata Uang Lokal**: Format Rupiah otomatis (contoh: `1.000.000`) baik pada tampilan maupun saat input data.
-   **💾 Penyimpanan Lokal**: Semua data tersimpan aman di browser Anda melalui `localStorage`.
-   **📂 Backup & Restore**: Ekspor data Anda ke file `.json` dan impor kembali kapan saja.
-   **📱 Responsif Penuh**: Tampilan optimal di desktop, tablet, maupun perangkat mobile.

## 🚀 Cara Memulai

### Prasyarat
-   Browser web modern (Chrome, Firefox, Edge, Safari).
-   (Opsional) Server lokal seperti **Laragon** atau VS Code Live Server.

### Instalasi
1.  Clone repositori ini:
    ```bash
    git clone https://github.com/Cwinzer321/wishlist.git
    ```
2.  Buka file `index.html` di browser Anda.

## 🛠️ Teknologi yang Digunakan
-   **Struktur**: HTML5 Semantic Elements
-   **Gaya (Styling)**: Vanilla CSS3 (Custom Variables, Flexbox, Grid, Backdrop-filter)
-   **Logika**: Vanilla JavaScript (ES6+, Intl.NumberFormat, LocalStorage API)

## 📖 Cara Penggunaan
1.  **Masukkan Budget**: Ketik jumlah uang yang Anda miliki (Maksimal Rp 10.000.000.000).
2.  **Tambah Barang**: Masukkan nama dan harga barang. Pastikan kedua kolom terisi jika Anda mulai mengisi salah satunya.
3.  **Pantau Target**: Barang yang harganya masuk dalam budget akan otomatis ditandai warna **hijau** dengan lencana "Achieved".
4.  **Kelola Data**: Gunakan tombol "Backup ke File" untuk mengunduh cadangan data.

## 🤝 Kontribusi
Silakan fork proyek ini dan kirimkan *pull request* jika Anda ingin menambahkan fitur atau perbaikan!

## 📝 Lisensi
Proyek ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detailnya.

---

Dibuat dengan ❤️ oleh [Raihan Yasykur](https://github.com/Cwinzer321)
