'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { Package, Tag, Layers } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    price: number;
    inventory: number;
    status: string;
    image?: string;
    vendor?: string;
    productType?: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productDetails, setProductDetails] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/');
                    return;
                }
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/products`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProducts(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setLoading(false);
            }
        };
        fetchProducts();
    }, [router]);

    const handleProductClick = async (productId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProductDetails(response.data);
            setSelectedProductId(productId);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching product details:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.vendor || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header
                    startDate="" endDate="" setStartDate={() => { }} setEndDate={() => { }} onLogout={handleLogout} onSearch={setSearchQuery}
                />
                <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage your inventory ({products.length} items).
                        </p>
                    </div>

                    {loading ? (
                        <div className="min-h-[400px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 overflow-hidden cursor-pointer"
                                    onClick={() => handleProductClick(product.id)}
                                >
                                    {/* Image Aspect Matrix */}
                                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Package className="h-12 w-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-white/90 backdrop-blur shadow-sm ${product.status === 'Active' ? 'text-green-700' : 'text-slate-600'
                                                }`}>
                                                {product.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">
                                            {product.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                            {product.vendor && (
                                                <span className="flex items-center gap-1">
                                                    <Tag className="h-3 w-3" />
                                                    {product.vendor}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold text-slate-900">
                                                    ${product.price.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                {product.inventory} in stock
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Product Details Modal (Preserved Logic, Updated Style) */}
            {isModalOpen && productDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 100 }}>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{productDetails.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-slate-500">Inventory: {productDetails.inventory}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-sm text-slate-500">Sold: {productDetails.totalSold}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Layers className="h-4 w-4" /> Order History
                            </h4>
                            {productDetails.orders.length > 0 ? (
                                <div className="space-y-3">
                                    {productDetails.orders.map((order: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    #{order.orderId.slice(-4)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{order.customerName}</div>
                                                    <div className="text-xs text-slate-500">{new Date(order.orderDate).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-900">${order.totalPrice.toFixed(2)}</div>
                                                <div className="text-xs text-slate-500">{order.quantity} units</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500 text-sm">No orders recorded for this product yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
