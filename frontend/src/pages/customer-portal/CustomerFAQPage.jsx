import React, { useState } from 'react';
import { HelpCircle, ChevronDown, MessageCircle, Phone, Mail, Search } from 'lucide-react';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';

const CustomerFAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  const faqCategories = [
    {
      category: 'Umum',
      icon: '📌',
      faqs: [
        {
          question: 'Bagaimana cara mengecek status layanan saya?',
          answer: 'Anda dapat mengecek status layanan di halaman Dashboard. Status akan ditampilkan di bagian informasi pelanggan.'
        },
        {
          question: 'Bagaimana cara menghubungi customer service?',
          answer: 'Anda dapat menghubungi CS melalui WhatsApp di 0813-1600-3245, atau klik tombol "Hubungi CS" di header portal ini.'
        },
        {
          question: 'Apakah saya bisa mengubah paket internet?',
          answer: 'Ya, Anda dapat mengajukan permohonan upgrade/downgrade paket dengan membuat tiket di menu "Tiket Saya" dengan jenis "Upgrade Paket".'
        }
      ]
    },
    {
      category: 'Pembayaran & Invoice',
      icon: '💳',
      faqs: [
        {
          question: 'Bagaimana cara membayar tagihan?',
          answer: 'Setelah menerima invoice, Anda dapat melakukan pembayaran melalui transfer bank ke rekening yang tertera di invoice. Konfirmasi pembayaran akan dikirim via WhatsApp.'
        },
        {
          question: 'Kapan tagihan bulanan diterbitkan?',
          answer: 'Invoice bulanan biasanya diterbitkan setiap tanggal 1 bulan berjalan untuk periode layanan bulan tersebut.'
        },
        {
          question: 'Apa yang terjadi jika pembayaran terlambat?',
          answer: 'Jika pembayaran melewati tanggal jatuh tempo, layanan akan diblokir sementara hingga pembayaran dilunasi. Denda keterlambatan mungkin dikenakan sesuai kebijakan.'
        },
        {
          question: 'Bagaimana cara download invoice?',
          answer: 'Anda dapat mendownload invoice dalam format PDF dari halaman "Invoice" dengan klik tombol "Download PDF" di invoice yang diinginkan.'
        }
      ]
    },
    {
      category: 'Teknis & Gangguan',
      icon: '🔧',
      faqs: [
        {
          question: 'Internet saya lambat, apa yang harus dilakukan?',
          answer: 'Langkah pertama: restart modem/router dengan mencabut power 10 detik lalu colokkan kembali. Jika masih lambat, coba restart perangkat Anda. Jika masih bermasalah, buat tiket di menu "Tiket Saya".'
        },
        {
          question: 'Bagaimana cara membuat tiket gangguan?',
          answer: 'Klik menu "Tiket Saya", lalu klik "Buat Tiket Baru". Pilih jenis "Perbaikan (Repair)", isi judul dan deskripsi masalah, lalu submit. Tim kami akan segera memproses.'
        },
        {
          question: 'Berapa lama waktu penanganan tiket?',
          answer: 'SLA penanganan: Priority High = 4 jam, Normal = 24 jam, Low = 48 jam. Anda akan menerima notifikasi WhatsApp untuk setiap update tiket.'
        },
        {
          question: 'Internet saya mati total, bagaimana?',
          answer: 'Cek lampu indikator modem apakah menyala. Jika tidak, cek kabel power dan restart modem. Jika lampu menyala tapi tidak bisa akses internet, segera buat tiket dengan priority "High".'
        }
      ]
    },
    {
      category: 'Akun & Keamanan',
      icon: '🔐',
      faqs: [
        {
          question: 'Bagaimana cara login ke customer portal?',
          answer: 'Gunakan nomor WhatsApp yang terdaftar. Sistem akan mengirim kode OTP 6 digit ke WhatsApp Anda. Masukkan kode tersebut untuk login.'
        },
        {
          question: 'Berapa lama sesi login berlaku?',
          answer: 'Sesi login berlaku selama 7 hari. Setelah itu Anda perlu login ulang dengan OTP.'
        },
        {
          question: 'Bagaimana jika nomor WhatsApp saya berubah?',
          answer: 'Hubungi customer service untuk update nomor WhatsApp di sistem kami. Bawa dokumen identitas untuk verifikasi.'
        }
      ]
    },
    {
      category: 'Instalasi & Pemasangan',
      icon: '📡',
      faqs: [
        {
          question: 'Berapa lama proses instalasi setelah registrasi?',
          answer: 'Proses instalasi biasanya 3-7 hari kerja setelah registrasi disetujui dan survey lokasi selesai.'
        },
        {
          question: 'Apakah ada biaya instalasi?',
          answer: 'Biaya instalasi bervariasi tergantung lokasi dan paket yang dipilih. Tim sales akan menginformasikan detail biaya saat proses registrasi.'
        },
        {
          question: 'Apa saja yang perlu disiapkan untuk instalasi?',
          answer: 'Pastikan ada akses ke atap/tempat pemasangan antena, sediakan stop kontak untuk perangkat, dan pastikan ada yang bisa menerima teknisi saat instalasi.'
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <CustomerPortalLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <HelpCircle className="h-7 w-7 mr-2 text-blue-600" />
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600">Temukan jawaban untuk pertanyaan umum</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada hasil ditemukan</p>
            </div>
          ) : (
            filteredFAQs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="text-2xl mr-2">{category.icon}</span>
                    {category.category}
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {category.faqs.map((faq, faqIndex) => {
                    const globalIndex = `${categoryIndex}-${faqIndex}`;
                    const isOpen = openIndex === globalIndex;
                    
                    return (
                      <div key={faqIndex}>
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 pr-4">{faq.question}</h3>
                            <ChevronDown
                              className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ${
                                isOpen ? 'transform rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-lg p-8 mt-8 text-white">
          <h2 className="text-xl font-bold mb-2">Tidak menemukan jawaban?</h2>
          <p className="mb-6 text-blue-100">Tim customer service kami siap membantu Anda!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://wa.me/6281316003245"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 px-4 py-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg hover:bg-opacity-30 transition-all"
            >
              <MessageCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">WhatsApp</p>
                <p className="text-sm text-blue-100">0813-1600-3245</p>
              </div>
            </a>
            
            <a
              href="tel:+6281316003245"
              className="flex items-center space-x-3 px-4 py-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg hover:bg-opacity-30 transition-all"
            >
              <Phone className="h-6 w-6" />
              <div>
                <p className="font-semibold">Telepon</p>
                <p className="text-sm text-blue-100">0813-1600-3245</p>
              </div>
            </a>
            
            <a
              href="mailto:support@aglis.biz.id"
              className="flex items-center space-x-3 px-4 py-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg hover:bg-opacity-30 transition-all"
            >
              <Mail className="h-6 w-6" />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-blue-100">support@aglis.biz.id</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerFAQPage;

