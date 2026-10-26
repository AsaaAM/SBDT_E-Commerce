'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'sbdt_guest_cart_items';

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total_items: 0, total_qty: 0, total_price: 0 });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper untuk memuat keranjang tamu dari localStorage
  const loadGuestCart = useCallback(() => {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const totalQty = parsed.reduce((sum, it) => sum + parseInt(it.qty, 10), 0);
          const totalPrice = parsed.reduce((sum, it) => sum + parseFloat(it.subtotal || (it.price * it.qty)), 0);
          setCart({
            items: parsed,
            total_items: parsed.length,
            total_qty: totalQty,
            total_price: totalPrice,
          });
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    setCart({ items: [], total_items: 0, total_qty: 0, total_price: 0 });
    return [];
  }, []);

  const saveGuestCart = (items) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
      const totalQty = items.reduce((sum, it) => sum + parseInt(it.qty, 10), 0);
      const totalPrice = items.reduce((sum, it) => sum + parseFloat(it.subtotal || (it.price * it.qty)), 0);
      setCart({
        items,
        total_items: items.length,
        total_qty: totalQty,
        total_price: totalPrice,
      });
    } catch (e) {
      console.error('Failed to save guest cart', e);
    }
  };

  const fetchCart = useCallback(async () => {
    if (!user) {
      loadGuestCart();
      return;
    }
    try {
      setLoading(true);
      const res = await fetchApi('/cart');
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch {
      loadGuestCart();
    } finally {
      setLoading(false);
    }
  }, [user, loadGuestCart]);

  // Saat user login, gabungkan keranjang tamu ke database
  useEffect(() => {
    async function syncGuestCartOnLogin() {
      if (!user) {
        loadGuestCart();
        return;
      }

      try {
        const guestItems = loadGuestCart();
        if (guestItems && guestItems.length > 0) {
          for (const item of guestItems) {
            try {
              await fetchApi('/cart/add', {
                method: 'POST',
                body: JSON.stringify({ product_id: item.product_id, qty: item.qty }),
              });
            } catch {
              // ignore individual sync errors
            }
          }
          localStorage.removeItem(GUEST_CART_KEY);
        }
      } catch {
        // ignore
      } finally {
        fetchCart();
      }
    }

    syncGuestCartOnLogin();
  }, [user]);

  const addToCart = async (productOrId, qty = 1) => {
    const productId = typeof productOrId === 'object' ? productOrId.id : productOrId;
    const productData = typeof productOrId === 'object' ? productOrId : null;

    if (!user) {
      // Simpan di keranjang tamu (localStorage)
      try {
        const stored = localStorage.getItem(GUEST_CART_KEY);
        let items = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(items)) items = [];

        const existingIdx = items.findIndex((it) => it.product_id === productId);
        if (existingIdx >= 0) {
          items[existingIdx].qty += qty;
          items[existingIdx].subtotal = items[existingIdx].qty * parseFloat(items[existingIdx].price);
        } else {
          // Ambil detail produk jika belum ada
          let prod = productData;
          if (!prod) {
            try {
              const pRes = await fetchApi(`/products/${productId}`);
              if (pRes.success) prod = pRes.data;
            } catch {
              // ignore
            }
          }

          items.push({
            item_id: `guest-${Date.now()}-${productId}`,
            product_id: productId,
            name: prod?.name || 'Produk Furnitur',
            sku: prod?.sku || `SKU-${productId}`,
            price: prod ? parseFloat(prod.price) : 0,
            image_url: prod?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
            qty,
            subtotal: qty * (prod ? parseFloat(prod.price) : 0),
          });
        }

        saveGuestCart(items);
        showToast('Produk berhasil ditambahkan ke keranjang belanja!');
        return true;
      } catch (err) {
        showToast('Gagal menambahkan ke keranjang tamu.');
        return false;
      }
    }

    // Jika sudah login, simpan ke database PostgreSQL Citus
    try {
      await fetchApi('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, qty }),
      });
      await fetchCart();
      showToast('Produk berhasil ditambahkan ke keranjang belanja!');
      return true;
    } catch (err) {
      showToast(err.message || 'Gagal menambahkan produk.');
      return false;
    }
  };

  const updateQty = async (itemId, qty) => {
    if (!user) {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      let items = stored ? JSON.parse(stored) : [];
      if (qty <= 0) {
        items = items.filter((it) => it.item_id !== itemId);
      } else {
        const idx = items.findIndex((it) => it.item_id === itemId);
        if (idx >= 0) {
          items[idx].qty = qty;
          items[idx].subtotal = qty * parseFloat(items[idx].price);
        }
      }
      saveGuestCart(items);
      return;
    }

    try {
      await fetchApi(`/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ qty }),
      });
      await fetchCart();
    } catch (err) {
      showToast(err.message || 'Gagal mengubah kuantitas.');
    }
  };

  const removeItem = async (itemId) => {
    if (!user) {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      let items = stored ? JSON.parse(stored) : [];
      items = items.filter((it) => it.item_id !== itemId);
      saveGuestCart(items);
      showToast('Item dihapus dari keranjang.');
      return;
    }

    try {
      await fetchApi(`/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      await fetchCart();
      showToast('Item dihapus dari keranjang.');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus item.');
    }
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem(GUEST_CART_KEY);
      setCart({ items: [], total_items: 0, total_qty: 0, total_price: 0 });
      return;
    }

    try {
      await fetchApi('/cart/clear', {
        method: 'DELETE',
      });
      setCart({ items: [], total_items: 0, total_qty: 0, total_price: 0 });
    } catch {
      // ignore
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        toastMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
