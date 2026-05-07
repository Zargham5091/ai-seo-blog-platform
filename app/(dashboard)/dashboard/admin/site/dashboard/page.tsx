'use client';

/**
 * app/(dashboard)/dashboard/admin/site/dashboard/page.tsx
 *
 * Site Dashboard — separate from the builder.
 * Shows: site status, visitor stats placeholder, form submissions.
 * For ecommerce sites: product management + order management.
 *
 * CREATE folder: app/(dashboard)/dashboard/admin/site/dashboard/
 * CREATE file:   page.tsx (this file)
 */

import {useCallback, useEffect, useState} from 'react';
import {
    Package, ShoppingCart, TrendingUp, Globe, Plus, Edit2,
    Trash2, Check, X, Loader2, AlertTriangle, ExternalLink,
    ChevronDown, Image as ImageIcon, DollarSign, Clock,
} from 'lucide-react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface Product {
    _id: string;
    name: string;
    price: number;
    comparePrice?: number;
    currency: string;
    images: string[];
    category?: string;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
}

interface Order {
    _id: string;
    orderNumber: string;
    status: OrderStatus;
    channel: string;
    total: number;
    currency: string;
    customer: { name: string; email?: string; phone?: string };
    items: { productName: string; quantity: number; price: number }[];
    createdAt: string;
}

interface DashboardData {
    site: {
        siteName: string;
        siteType: string;
        isPublished: boolean;
        publishedAt?: string;
        lastBuiltAt?: string;
    };
    ecommerce: {
        productCount: number;
        orderTotal: number;
        orderPending: number;
        revenue: number;
        recentOrders: Order[];
    } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-700',
};

function formatCurrency(amount: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(amount);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Form Modal
// ─────────────────────────────────────────────────────────────────────────────

function ProductModal({
                          product,
                          onSave,
                          onClose,
                      }: {
    product?: Product | null;
    onSave: (data: Partial<Product>) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState({
        name: product?.name ?? '',
        price: product?.price ?? 0,
        comparePrice: product?.comparePrice ?? '',
        currency: product?.currency ?? 'USD',
        category: product?.category ?? '',
        stock: product?.stock ?? -1,
        isActive: product?.isActive ?? true,
        isFeatured: product?.isFeatured ?? false,
        images: product?.images ?? [],
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function handleSubmit() {
        if (!form.name.trim()) {
            setErr('Product name is required');
            return;
        }
        if (form.price < 0) {
            setErr('Price must be 0 or more');
            return;
        }
        setSaving(true);
        setErr(null);
        try {
            await onSave({
                ...form,
                price: Number(form.price),
                comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
                stock: Number(form.stock),
            });
            onClose();
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Save failed');
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="font-bold text-lg">{product ? 'Edit Product' : 'Add Product'}</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5"/></button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Product Name *</label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({...f, name: e.target.value}))}
                            placeholder="e.g. Premium T-Shirt"
                            className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {/* Price row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Price *</label>
                            <input
                                type="number" min="0" step="0.01"
                                value={form.price}
                                onChange={e => setForm(f => ({...f, price: parseFloat(e.target.value) || 0}))}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Compare Price</label>
                            <input
                                type="number" min="0" step="0.01"
                                value={form.comparePrice}
                                onChange={e => setForm(f => ({...f, comparePrice: e.target.value}))}
                                placeholder="Optional"
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Currency</label>
                            <select
                                value={form.currency}
                                onChange={e => setForm(f => ({...f, currency: e.target.value}))}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
                            >
                                {['USD', 'EUR', 'GBP', 'PKR', 'AED', 'SAR', 'INR'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category + Stock */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <input
                                value={form.category}
                                onChange={e => setForm(f => ({...f, category: e.target.value}))}
                                placeholder="e.g. Clothing"
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Stock (-1 = unlimited)</label>
                            <input
                                type="number"
                                value={form.stock}
                                onChange={e => setForm(f => ({...f, stock: parseInt(e.target.value) || -1}))}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isActive}
                                   onChange={e => setForm(f => ({...f, isActive: e.target.checked}))}
                                   className="rounded h-4 w-4"/>
                            <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isFeatured}
                                   onChange={e => setForm(f => ({...f, isFeatured: e.target.checked}))}
                                   className="rounded h-4 w-4"/>
                            <span className="text-sm">Featured</span>
                        </label>
                    </div>

                    {err && <p className="text-sm text-red-500 flex items-center gap-1"><AlertTriangle
                        className="h-4 w-4"/>{err}</p>}
                </div>

                <div className="flex gap-3 px-6 py-4 border-t">
                    <button onClick={onClose}
                            className="flex-1 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-colors">Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                        {product ? 'Save Changes' : 'Add Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SiteDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [dashRes, prodRes] = await Promise.all([
                fetch('/api/site/dashboard').then(r => r.json()),
                fetch('/api/site/products').then(r => r.json()),
            ]);
            if (dashRes.success) setData(dashRes.data);
            if (prodRes.success) setProducts(prodRes.data ?? []);
        } catch {
            setError('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    async function handleSaveProduct(formData: Partial<Product>) {
        const isEdit = !!editingProduct;
        const res = await fetch('/api/site/dashboard', {
            method: isEdit ? 'PATCH' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: isEdit ? 'update_product' : 'create_product',
                ...(isEdit ? {productId: editingProduct!._id} : {}),
                ...formData,
            }),
        }).then(r => r.json());
        if (!res.success) throw new Error(res.error ?? 'Save failed');
        await fetchData();
        setEditingProduct(null);
    }

    async function handleDeleteProduct(productId: string) {
        if (!confirm('Delete this product?')) return;
        setDeletingId(productId);
        try {
            await fetch('/api/site/dashboard', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({productId}),
            });
            setProducts(p => p.filter(x => x._id !== productId));
        } finally {
            setDeletingId(null);
        }
    }

    async function handleOrderStatus(orderId: string, status: OrderStatus) {
        setUpdatingOrderId(orderId);
        try {
            await fetch('/api/site/dashboard', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action: 'update_order_status', orderId, status}),
            });
            await fetchData();
        } finally {
            setUpdatingOrderId(null);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500"/>
        </div>
    );

    if (error || !data) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <AlertTriangle className="h-8 w-8 text-red-400"/>
            <p className="text-sm text-muted-foreground">{error ?? 'Site not found'}</p>
            <Link href="/dashboard/admin/site" className="text-sm text-indigo-600 hover:underline">Go to builder
                →</Link>
        </div>
    );

    const {site, ecommerce} = data;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">{site.siteName}</h1>
                    <p className="text-sm text-muted-foreground capitalize">{site.siteType} site</p>
                </div>
                <div className="flex items-center gap-3">
                    {site.isPublished ? (
                        <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <Globe className="h-4 w-4"/> Published
            </span>
                    ) : (
                        <span className="text-sm text-muted-foreground">Not published</span>
                    )}
                    <Link
                        href="/dashboard/admin/site"
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Open Builder
                    </Link>
                </div>
            </div>

            {/* Stats row */}
            {ecommerce && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Total Orders',
                            value: ecommerce.orderTotal,
                            icon: ShoppingCart,
                            color: 'text-blue-600 bg-blue-50'
                        },
                        {
                            label: 'Pending Orders',
                            value: ecommerce.orderPending,
                            icon: Clock,
                            color: 'text-yellow-600 bg-yellow-50'
                        },
                        {
                            label: 'Revenue',
                            value: formatCurrency(ecommerce.revenue),
                            icon: DollarSign,
                            color: 'text-green-600 bg-green-50',
                            isString: true
                        },
                        {
                            label: 'Active Products',
                            value: ecommerce.productCount,
                            icon: Package,
                            color: 'text-purple-600 bg-purple-50'
                        },
                    ].map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="bg-card border rounded-2xl p-5 flex items-center gap-4">
                                <div
                                    className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                                    <Icon className="h-6 w-6"/>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Products (ecommerce only) */}
            {ecommerce && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Products</h2>
                        <button
                            onClick={() => {
                                setEditingProduct(null);
                                setShowProductModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="h-4 w-4"/> Add Product
                        </button>
                    </div>

                    {products.length === 0 ? (
                        <div className="bg-card border border-dashed rounded-2xl p-12 text-center">
                            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
                            <p className="font-semibold text-gray-900 mb-1">No products yet</p>
                            <p className="text-sm text-muted-foreground mb-4">Add your first product to start
                                selling.</p>
                            <button
                                onClick={() => setShowProductModal(true)}
                                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Add First Product
                            </button>
                        </div>
                    ) : (
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead
                                    className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Product</th>
                                    <th className="px-4 py-3 text-left">Price</th>
                                    <th className="px-4 py-3 text-left">Stock</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y">
                                {products.map(p => (
                                    <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {p.images[0] ? (
                                                        <img src={p.images[0]} alt={p.name}
                                                             className="h-full w-full object-cover"/>
                                                    ) : (
                                                        <ImageIcon className="h-4 w-4 text-gray-400"/>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{p.name}</p>
                                                    {p.category &&
                                                        <p className="text-xs text-muted-foreground">{p.category}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold">{formatCurrency(p.price, p.currency)}</span>
                                            {p.comparePrice && (
                                                <span className="text-xs text-muted-foreground line-through ml-1">
                            {formatCurrency(p.comparePrice, p.currency)}
                          </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.stock === -1 ? (
                                                <span className="text-xs text-green-600 font-medium">Unlimited</span>
                                            ) : p.stock === 0 ? (
                                                <span className="text-xs text-red-500 font-medium">Out of stock</span>
                                            ) : (
                                                <span className="text-xs font-medium">{p.stock} left</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.isActive ? 'Active' : 'Hidden'}
                        </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(p);
                                                        setShowProductModal(true);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5 text-gray-500"/>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(p._id)}
                                                    disabled={deletingId === p._id}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    {deletingId === p._id
                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400"/>
                                                        : <Trash2 className="h-3.5 w-3.5 text-red-400"/>
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Orders (ecommerce only) */}
            {ecommerce && ecommerce.recentOrders.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
                    <div className="bg-card border rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead
                                className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left">Order</th>
                                <th className="px-4 py-3 text-left">Customer</th>
                                <th className="px-4 py-3 text-left">Total</th>
                                <th className="px-4 py-3 text-left">Channel</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Date</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y">
                            {ecommerce.recentOrders.map(order => (
                                <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{order.customer.name}</p>
                                        {order.customer.email &&
                                            <p className="text-xs text-muted-foreground">{order.customer.email}</p>}
                                    </td>
                                    <td className="px-4 py-3 font-semibold">{formatCurrency(order.total, order.currency)}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className="capitalize text-xs text-muted-foreground">{order.channel}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                                            {/* Quick status update */}
                                            <div className="relative group">
                                                <button className="p-1 rounded hover:bg-muted" title="Update status">
                                                    <ChevronDown className="h-3 w-3 text-gray-400"/>
                                                </button>
                                                <div
                                                    className="absolute right-0 top-6 z-10 bg-card border rounded-xl shadow-lg py-1 hidden group-hover:block min-w-[130px]">
                                                    {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleOrderStatus(order._id, s)}
                                                            disabled={updatingOrderId === order._id || order.status === s}
                                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted capitalize transition-colors ${order.status === s ? 'font-bold text-indigo-600' : ''}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(order.createdAt)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Non-ecommerce site placeholder */}
            {!ecommerce && (
                <div className="bg-card border rounded-2xl p-8 text-center">
                    <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
                    <p className="font-semibold text-gray-900 mb-1">Site Analytics</p>
                    <p className="text-sm text-muted-foreground">
                        Visitor analytics will appear here once you publish and connect Google Analytics.
                    </p>
                    <Link
                        href="/dashboard/admin/site"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                    >
                        <ExternalLink className="h-4 w-4"/> Open Builder
                    </Link>
                </div>
            )}

            {/* Product modal */}
            {showProductModal && (
                <ProductModal
                    product={editingProduct}
                    onSave={handleSaveProduct}
                    onClose={() => {
                        setShowProductModal(false);
                        setEditingProduct(null);
                    }}
                />
            )}
        </div>
    );
}