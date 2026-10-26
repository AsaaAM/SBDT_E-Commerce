'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  FolderTree,
  Tag,
  Users,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Truck,
  Check,
  Copy,
  Percent,
  Calendar,
  Lock,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';
import { fetchApi, formatRupiah } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PRESET_ASSETS = [
  { name: 'Sofa 3 Dudukan', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' },
  { name: 'Kursi Kerja Ergonomis', url: 'https://images.unsplash.com/photo-1580481077195-c3f9a3036493?auto=format&fit=crop&w=800&q=80' },
  { name: 'Meja Makan Kayu Solid', url: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Lemari Pakaian 3 Pintu', url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80' },
  { name: 'Lampu Meja Nordic', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Rak Buku Tingkat', url: 'https://images.unsplash.com/photo-1594671581654-278554dd3460?auto=format&fit=crop&w=800&q=80' },
];

export default function AdminDashboardPage() {
  const { user, isAdmin, isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promos, setPromos] = useState([]);
  const [userList, setUserList] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Asset Upload & Validation States
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [validatingOrderId, setValidatingOrderId] = useState(null);
  const [copiedResi, setCopiedResi] = useState('');

  // Form Modal State Produk
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    price: '',
    category_id: '',
    description: '',
    dimensions: '',
    weight_kg: '',
    material: '',
    color: '',
    image_url: '',
  });

  // Form Modal State Kategori
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'FolderTree',
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  });

  // Form Modal State Promo (dengan Garansi 1x / User)
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({
    code: '',
    title: '',
    discount_percent: '10',
    max_discount: '500000',
    min_purchase: '1000000',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
  });

  // Form Modal State User
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'warehouse',
    phone: '',
    address: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'products') {
        const [pRes, cRes] = await Promise.all([
          fetchApi('/products?limit=50'),
          fetchApi('/products/categories'),
        ]);
        if (pRes.success) setProducts(pRes.data.items);
        if (cRes.success) setCategories(cRes.data);
      } else if (activeTab === 'categories') {
        const res = await fetchApi('/products/categories');
        if (res.success) setCategories(res.data);
      } else if (activeTab === 'promos') {
        const res = await fetchApi('/products/promos');
        if (res.success) setPromos(res.data);
      } else if (activeTab === 'users') {
        const res = await fetchApi('/admin/users');
        if (res.success) setUserList(res.data);
      } else if (activeTab === 'orders') {
        const res = await fetchApi('/admin/orders');
        if (res.success) setAllOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (isAdmin || isOwner)) {
      loadData();
    }
  }, [activeTab, user]);

  if (!user || (!isAdmin && !isOwner)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Akses Ditolak (Khusus Admin)</h2>
        <p className="text-xs text-slate-500">
          Halaman ini dilindungi RBAC. Gunakan tombol Mode Demo di atas dan pilih <strong>Admin</strong> untuk menguji halaman ini.
        </p>
      </div>
    );
  }

  // Handle Submit Produk
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...prodForm,
        price: parseFloat(prodForm.price),
        category_id: prodForm.category_id ? parseInt(prodForm.category_id, 10) : null,
        weight_kg: prodForm.weight_kg ? parseFloat(prodForm.weight_kg) : null,
      };

      if (editingProduct) {
        await fetchApi(`/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowProductModal(false);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan produk');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan produk ini?')) return;
    try {
      await fetchApi(`/admin/products/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus produk');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset(true);
    setUploadSuccess('');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetchApi('/admin/upload', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              base64Data: reader.result,
            }),
          });
          if (res.success) {
            setProdForm((prev) => ({ ...prev, image_url: res.data.file_url }));
            setUploadSuccess(`Asset "${res.data.filename}" berhasil diunggah dan disimpan ke server!`);
          }
        } catch (err) {
          alert(err.message || 'Gagal mengunggah asset gambar');
        } finally {
          setUploadingAsset(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Gagal membaca file gambar');
      setUploadingAsset(false);
    }
  };

  const handleValidateDelivery = async (orderId, orderNumber, total) => {
    if (
      !confirm(
        `Konfirmasi penerimaan & validasi TERKIRIM untuk Pesanan ${orderNumber}?\n\nSetelah divalidasi, status berubah jadi TERKIRIM, dana sebesar ${formatRupiah(
          total
        )} akan dicairkan (Duit Cair) dan otomatis masuk ke laporan grafik Omset Owner.`
      )
    ) {
      return;
    }

    try {
      setValidatingOrderId(orderId);
      const res = await fetchApi(`/admin/orders/${orderId}/validate-delivery`, {
        method: 'POST',
      });
      if (res.success) {
        alert(
          `✓ BERHASIL TERKIRIM & DUIT CAIR!\n\nPesanan: ${res.data.order_number}\nNo. Resi: ${res.data.tracking_number}\nStatus: TERKIRIM\n\nDana ${formatRupiah(
            res.data.total
          )} resmi dicairkan dan sekarang masuk ke grafik Omset Owner!`
        );
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Gagal memvalidasi pengiriman');
    } finally {
      setValidatingOrderId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUserForm),
      });
      setShowUserModal(false);
      setNewUserForm({ name: '', email: '', password: '', role: 'warehouse', phone: '', address: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal membuat user');
    }
  };

  // --- KATEGORI HANDLERS ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: catForm.name.trim(),
        slug: catForm.slug.trim() || catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: catForm.description.trim(),
        icon: catForm.icon || 'FolderTree',
        image_url: catForm.image_url || null,
      };

      if (editingCategory) {
        await fetchApi(`/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan kategori');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Hapus kategori "${name}"? Produk dalam kategori ini akan kehilangan relasi kategorinya.`)) return;
    try {
      await fetchApi(`/admin/categories/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus kategori');
    }
  };

  // --- PROMO HANDLERS (GARANSI 1X/USER) ---
  const handleSavePromo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: promoForm.code.trim().toUpperCase(),
        title: promoForm.title.trim(),
        discount_percent: parseFloat(promoForm.discount_percent),
        max_discount: promoForm.max_discount ? parseFloat(promoForm.max_discount) : null,
        min_purchase: promoForm.min_purchase ? parseFloat(promoForm.min_purchase) : 0,
        start_date: promoForm.start_date,
        end_date: promoForm.end_date,
        is_active: promoForm.is_active,
      };

      if (editingPromo) {
        await fetchApi(`/admin/promos/${editingPromo.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/admin/promos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowPromoModal(false);
      setEditingPromo(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan kode promo');
    }
  };

  const handleTogglePromo = async (promo) => {
    try {
      await fetchApi(`/admin/promos/${promo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !promo.is_active }),
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status promo');
    }
  };

  const handleDeletePromo = async (id, code) => {
    if (!confirm(`Hapus kode promo "${code}"?`)) return;
    try {
      await fetchApi(`/admin/promos/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus kode promo');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Role: Administrator Sistem
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Master Panel Administrator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Pengelolaan data master katalog (Reference Tables), promo, otorisasi akun pengguna, dan pemantauan transaksi.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-b-2 border-purple-600 text-purple-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produk Furnitur</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-b-2 border-purple-600 text-purple-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Kategori</span>
        </button>

        <button
          onClick={() => setActiveTab('promos')}
          className={`pb-3 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'promos'
              ? 'border-b-2 border-purple-600 text-purple-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kode Promo</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-b-2 border-purple-600 text-purple-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Pengguna</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-b-2 border-purple-600 text-purple-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pantau Pesanan</span>
        </button>
      </div>

      {/* TAB 1: PRODUK */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">
              Data tabel referensi <code>products</code> direplikasi ke semua worker.
            </span>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProdForm({
                  name: '',
                  sku: `SKU-${Date.now().toString().slice(-6)}`,
                  price: '',
                  category_id: categories[0]?.id?.toString() || '1',
                  description: '',
                  dimensions: '100 x 50 x 75 cm',
                  weight_kg: '15',
                  material: 'Kayu Ek Solid',
                  color: 'Natural Oak',
                  image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
                });
                setShowProductModal(true);
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Info Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                  <th className="py-3 px-4 text-right">Total Stok (Shard)</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block">{p.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {p.category_name}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">
                      {p.total_stock} unit
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setProdForm({
                              name: p.name,
                              sku: p.sku,
                              price: p.price.toString(),
                              category_id: p.category_id?.toString() || '',
                              description: p.description || '',
                              dimensions: p.dimensions || '',
                              weight_kg: p.weight_kg ? p.weight_kg.toString() : '',
                              material: p.material || '',
                              color: p.color || '',
                              image_url: p.image_url || '',
                            });
                            setShowProductModal(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KATEGORI */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">
              Data tabel referensi <code>categories</code> direplikasi otomatis ke semua worker node Citus.
            </span>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatForm({
                  name: '',
                  slug: '',
                  description: '',
                  icon: 'FolderTree',
                  image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
                });
                setShowCategoryModal(true);
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Info Kategori</th>
                  <th className="py-3 px-4">Slug URL</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada data kategori. Klik "Tambah Kategori Baru" di atas.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {c.image_url ? (
                            <img
                              src={c.image_url}
                              alt={c.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                              <FolderTree className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{c.name}</span>
                            <span className="text-[10px] text-slate-400">ID: #{c.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="bg-slate-100 text-purple-700 px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
                          /{c.slug}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        {c.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(c);
                              setCatForm({
                                name: c.name,
                                slug: c.slug,
                                description: c.description || '',
                                icon: c.icon || 'FolderTree',
                                image_url: c.image_url || '',
                              });
                              setShowCategoryModal(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Kategori"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KODE PROMO */}
      {activeTab === 'promos' && (
        <div className="space-y-4">
          {/* Banner Edukasi 1x/User Rule */}
          <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl flex items-start gap-3 shadow-xs">
            <div className="p-2.5 bg-purple-700 text-white rounded-xl shadow-xs shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-purple-950 text-sm">
                  Sistem Kode Promo & Batasan 1x Pemakaian per Pengguna
                </h4>
                <span className="bg-purple-200 text-purple-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> 1x / User
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Setiap kode promo yang dibuat oleh Admin otomatis dapat digunakan pembeli saat checkout. Sistem basis data Citus membatasi <strong>setiap kode promo hanya dapat digunakan 1 kali per akun pengguna</strong>. Riwayat pemakaian dicatat secara global dan atomik pada Reference Table <code>promo_usages</code> untuk mencegah multi-klaim secara transparan dan aman.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Daftar Voucher & Kode Promo Aktif
              </span>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {promos.length} Promo Terdaftar
              </span>
            </div>
            <button
              onClick={() => {
                setEditingPromo(null);
                setPromoForm({
                  code: '',
                  title: '',
                  discount_percent: '15',
                  max_discount: '500000',
                  min_purchase: '1000000',
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  is_active: true,
                });
                setShowPromoModal(true);
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Kode Promo Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode Promo</th>
                  <th className="py-3 px-4">Judul / Deskripsi Promo</th>
                  <th className="py-3 px-4 text-right">Besaran Diskon</th>
                  <th className="py-3 px-4 text-right">Min. Belanja</th>
                  <th className="py-3 px-4">Masa Berlaku</th>
                  <th className="py-3 px-4 text-center">Batas Kuota</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada kode promo. Klik "Buat Kode Promo Baru" di atas.
                    </td>
                  </tr>
                ) : (
                  promos.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md text-xs tracking-wider inline-block">
                          {pr.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{pr.title}</span>
                        <span className="text-[10px] text-slate-400">ID: #{pr.id}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-purple-700 text-sm">{pr.discount_percent}%</div>
                        <div className="text-[10px] text-slate-400">
                          {pr.max_discount ? `Maks. ${formatRupiah(pr.max_discount)}` : 'Tanpa batas'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {parseFloat(pr.min_purchase) > 0 ? formatRupiah(pr.min_purchase) : 'Rp 0 (Semua Nilai)'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        <div>Mulai: {pr.start_date ? new Date(pr.start_date).toLocaleDateString('id-ID') : '-'}</div>
                        <div>Hingga: {pr.end_date ? new Date(pr.end_date).toLocaleDateString('id-ID') : '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap">
                          <Lock className="w-2.5 h-2.5" /> 1x / Akun
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleTogglePromo(pr)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer ${
                            pr.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Klik untuk aktifkan/nonaktifkan promo"
                        >
                          {pr.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-slate-500" />
                              <span>Non-aktif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPromo(pr);
                              setPromoForm({
                                code: pr.code,
                                title: pr.title,
                                discount_percent: pr.discount_percent.toString(),
                                max_discount: pr.max_discount ? parseFloat(pr.max_discount).toString() : '',
                                min_purchase: pr.min_purchase ? parseFloat(pr.min_purchase).toString() : '',
                                start_date: pr.start_date ? pr.start_date.split('T')[0] : '',
                                end_date: pr.end_date ? pr.end_date.split('T')[0] : '',
                                is_active: pr.is_active,
                              });
                              setShowPromoModal(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Promo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(pr.id, pr.code)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Hapus Promo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">
              Manajemen akun pengguna dan hak akses RBAC (Role-Based Access Control).
            </span>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Staf / User</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Hak Akses</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Terdaftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        u.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'warehouse' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.phone || '-'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ORDERS OVERVIEW */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Banner Informasi Duit Cair */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-extrabold text-emerald-950 text-sm">
                Validasi Pengiriman & Mekanisme Pencairan Dana (Duit Cair)
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Ketika paket telah diantar oleh kurir dan nomor resi terkonfirmasi, Admin memvalidasi status menjadi <strong>TERKIRIM</strong>. Tindakan ini mencairkan dana transaksi sehingga resmi masuk dan dihitung ke dalam grafik <strong>Omset Bisnis Owner</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. Pesanan</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Gudang Hub</th>
                  <th className="py-3 px-4">Total Nilai</th>
                  <th className="py-3 px-4">Nomor Resi Pengiriman</th>
                  <th className="py-3 px-4">Status Pesanan</th>
                  <th className="py-3 px-4 text-center">Aksi Validasi (Duit Cair)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allOrders.map((ord) => {
                  const isDelivered = ord.status === 'terkirim' || ord.status === 'selesai';
                  const isUnpaid = ord.status === 'menunggu_pembayaran';
                  const canValidate = ['dibayar', 'diproses', 'dikemas', 'dikirim'].includes(ord.status);

                  return (
                    <tr key={`${ord.warehouse_id}-${ord.id}`} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{ord.order_number}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{ord.customer_name}</span>
                        <span className="text-[10px] text-slate-500">{ord.shipping_city || ord.city || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-blue-700">
                        {ord.warehouse_name}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {formatRupiah(ord.total)}
                      </td>
                      <td className="py-3.5 px-4">
                        {ord.tracking_number ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Truck className="w-3 h-3 text-emerald-600" />
                              <span>{ord.tracking_number}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(ord.tracking_number);
                                setCopiedResi(ord.tracking_number);
                                setTimeout(() => setCopiedResi(''), 2000);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-1"
                              title="Salin Resi"
                            >
                              {copiedResi === ord.tracking_number ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum Ada Resi</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`capitalize font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isUnpaid
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isDelivered ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                              <CheckCircle className="w-3 h-3 text-emerald-700" />
                              <span>TERKIRIM • DUIT CAIR</span>
                            </span>
                            <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                              Masuk ke Omset Owner
                            </span>
                          </div>
                        ) : canValidate ? (
                          <button
                            onClick={() => handleValidateDelivery(ord.id, ord.order_number, ord.total)}
                            disabled={validatingOrderId === ord.id}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5 shadow-sm transition"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>
                              {validatingOrderId === ord.id ? 'Memproses...' : '✓ Validasi TERKIRIM (Duit Cair)'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Menunggu Pembayaran VA
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT PRODUK */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Furnitur Baru'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">SKU Unik</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kategori</label>
                  <select
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              {/* ASSET GAMBAR PRODUK (UPLOAD FILE / PRESET ASSET) */}
              <div className="space-y-2.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-700" />
                    <span>Asset Gambar Produk</span>
                  </label>
                  <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    File Asset Storage
                  </span>
                </div>

                {/* Preview Asset Terpilih */}
                {prodForm.image_url ? (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                    <img
                      src={prodForm.image_url}
                      alt="Preview Asset"
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-slate-900 block truncate">
                        {prodForm.image_url.startsWith('/uploads/') ? 'Asset Terupload (Lokal)' : 'Asset Pustaka IKEA'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block truncate">
                        {prodForm.image_url}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Opsi 1: Upload File Gambar */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    1. Upload File Gambar dari Laptop/PC (.png, .jpg, .webp)
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-lg cursor-pointer transition text-purple-700 font-bold text-xs">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingAsset ? 'Mengunggah file ke asset storage...' : 'Pilih File Asset dari Komputer'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingAsset}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadSuccess && (
                    <span className="text-[10px] text-emerald-600 font-semibold block">
                      ✓ {uploadSuccess}
                    </span>
                  )}
                </div>

                {/* Opsi 2: Pustaka Preset Asset */}
                <div className="space-y-1 pt-2 border-t border-slate-200/80">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    2. Atau Pilih dari Pustaka Asset IKEA
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_ASSETS.map((asset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setProdForm({ ...prodForm, image_url: asset.url });
                          setUploadSuccess('');
                        }}
                        className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition ${
                          prodForm.image_url === asset.url
                            ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500'
                            : 'border-slate-200 bg-white hover:bg-slate-100'
                        }`}
                      >
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-7 h-7 rounded object-cover shrink-0"
                        />
                        <span className="text-[10px] font-bold text-slate-800 truncate">
                          {asset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dimensi</label>
                  <input
                    type="text"
                    value={prodForm.dimensions}
                    onChange={(e) => setProdForm({ ...prodForm, dimensions: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Material</label>
                  <input
                    type="text"
                    value={prodForm.material}
                    onChange={(e) => setProdForm({ ...prodForm, material: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Deskripsi</label>
                <textarea
                  rows={3}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH USER */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Tambah Akun Pengguna / Staf</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Hak Akses Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                >
                  <option value="warehouse">Orang Gudang (Warehouse)</option>
                  <option value="user">User (Pembeli)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold"
                >
                  Daftarkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KATEGORI */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {editingCategory ? 'Edit Kategori Furnitur' : 'Tambah Kategori Furnitur Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kursi & Sofa Scandinavian"
                  value={catForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setCatForm({
                      ...catForm,
                      name: newName,
                      slug: editingCategory ? catForm.slug : autoSlug,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex justify-between">
                  <span>Slug URL (Identifier Kategori)</span>
                  <span className="text-slate-400 text-[10px]">Huruf kecil, tanda hubung (-)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono">/</span>
                  <input
                    type="text"
                    required
                    placeholder="kursi-sofa"
                    value={catForm.slug}
                    onChange={(e) => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full pl-6 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Deskripsi Kategori</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat produk dalam kategori ini..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700 flex justify-between">
                  <span>Asset Gambar Kategori</span>
                  <span className="text-purple-700 text-[10px] font-bold">Pilih Preset atau Input URL</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_ASSETS.map((asset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCatForm({ ...catForm, image_url: asset.url })}
                      className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition ${
                        catForm.image_url === asset.url
                          ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500'
                          : 'border-slate-200 bg-white hover:bg-slate-100'
                      }`}
                    >
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-6 h-6 rounded object-cover shrink-0"
                      />
                      <span className="text-[10px] font-bold text-slate-800 truncate">
                        {asset.name}
                      </span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Atau tempel URL gambar kustom..."
                  value={catForm.image_url || ''}
                  onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 text-[11px]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KODE PROMO (DENGAN ATURAN 1X/USER) */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {editingPromo ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Aturan 1x/User Alert */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Aturan Otomatis: 1x Pemakaian per Pengguna</strong>
                <span className="text-[11px] text-amber-800 leading-tight block">
                  Setiap kode promo yang dibuat secara ketat dibatasi maksimal 1 kali pakai per akun pembeli. Database Citus memvalidasi riwayat klaim di tabel referensi terdistribusi <code>promo_usages</code>.
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex justify-between">
                    <span>Kode Promo</span>
                    <span className="text-purple-700 text-[10px] font-bold">Auto-Kapital</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: HEMAT20"
                    value={promoForm.code}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden font-mono font-bold tracking-wider text-purple-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Persentase Diskon (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      placeholder="15"
                      value={promoForm.discount_percent}
                      onChange={(e) => setPromoForm({ ...promoForm, discount_percent: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 pr-8 focus:bg-white focus:border-purple-600 focus:outline-hidden font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Judul / Deskripsi Promo</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Promo Spesial Mahasiswa SBDT IKEA Edition"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Maks. Potongan Diskon (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500000 (Kosongkan jika tanpa batas)"
                    value={promoForm.max_discount}
                    onChange={(e) => setPromoForm({ ...promoForm, max_discount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Min. Nilai Belanja (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1000000 (0 jika tanpa batas)"
                    value={promoForm.min_purchase}
                    onChange={(e) => setPromoForm({ ...promoForm, min_purchase: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tanggal Mulai Berlaku</label>
                  <input
                    type="date"
                    required
                    value={promoForm.start_date}
                    onChange={(e) => setPromoForm({ ...promoForm, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tanggal Berakhir</label>
                  <input
                    type="date"
                    required
                    value={promoForm.end_date}
                    onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Status Publikasi Promo</span>
                  <span className="text-[11px] text-slate-500">
                    Jika aktif, kode dapat langsung diklaim pembeli pada proses checkout
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoForm.is_active}
                    onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingPromo ? 'Simpan Perubahan Promo' : 'Buat Kode Promo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
