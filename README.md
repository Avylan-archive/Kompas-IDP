# KOMPAS — Portal Kompetensi Pegawai (IDP)

**KOMPAS** (*Kompetensi dan Pengembangan Aparatur Sipil Negara*) adalah aplikasi web prototipe untuk membantu aparatur merencanakan, menelusuri, dan menyusun **Individual Development Plan (IDP)** secara terstruktur berdasarkan profil jabatan dan kebutuhan kompetensi tahunan.

> **Coba Aplikasi Secara Online:**  
> [https://avylan-archive.github.io/Kompas-IDP/](https://avylan-archive.github.io/Kompas-IDP/)

> *Catatan: Aplikasi ini merupakan prototipe pelatihan. Seluruh data sampel yang ditampilkan bersifat simulasi (dummy) dan bukan sistem resmi instansi terkait.*

---

## Fitur Utama

- **Beranda**: Ringkasan progres Jam Pelajaran (JP) tahunan, indikator capaian tiga pilar kompetensi, serta notifikasi pelatihan baru yang sesuai dengan kebutuhan kompetensi.
- **Profil Saya**: Menampilkan kompetensi yang sudah dimiliki, kompetensi yang perlu dikembangkan, serta fitur edit profil (**Nama**, **Jabatan**, **Satuan Kerja**, dan **Foto Profil**).
- **Katalog Pelatihan**: Pencarian dan penyaringan program pelatihan/sertifikasi berdasarkan kata kunci, jabatan sasaran, dan bidang kompetensi, serta usulan katalog mandiri oleh jabatan Ahli Utama.
- **Rekomendasi Terarah**: Pemetaan rekomendasi pelatihan berbasis profil menggunakan AI beserta persentase kecocokan, alasan relevansi, dan tombol **Bagikan ke WhatsApp**.
- **Draf IDP & Generator CV**: Pengelolaan daftar pelatihan pilihan, pencatatan target kompetensi & rencana implementasi, penandaan status selesai, serta pembuatan CV pelatihan siap cetak/unduh HTML.
- **Panel Tugas Admin**: Pengelolaan katalog pelatihan resmi, persetujuan pengajuan katalog baru, serta penugasan (*assign*) pelatihan langsung ke Draf IDP pegawai.
- **Progressive Web App (PWA)**: Mendukung pemasangan (*install*) ke layar utama perangkat mobile/desktop dengan dukungan tampilan responsif termasuk layar ponsel 360px.

---

## Teknologi yang Digunakan

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Autentikasi & Basis Data**: Firebase Authentication (Google Sign-In) & Cloud Firestore
- **Backend / Rekomendasi**: Express (`server.ts`) & Google Gemini API (`@google/genai`)
- **Deployment**: GitHub Actions & GitHub Pages (build menggunakan Bun)

---

## Menjalankan Secara Lokal

1. Salin file konfigurasi lingkungan `.env.example` menjadi `.env` dan isi variabel yang diperlukan.
2. Instal dependensi:
   ```bash
   bun install
   ```
3. Jalankan mode pengembangan:
   ```bash
   bun run dev
   ```
4. Build produksi:
   ```bash
   bun run build
   ```
