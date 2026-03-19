"use client";

import { useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
    Box, 
    ShoppingCart, 
    ArrowUpRight, 
    ArrowDownLeft, 
    History, 
    MinusCircle, 
    PlusCircle,
    AlertCircle,
    Package,
    Tag,
    BarChart3
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function InventoryPage() {
    const { t, n } = useLanguage();
    
    const initialInventory = [
        { id: 1, name: t('urea'), category: t('fertilizer'), quantity: 4, unit: t('bags'), threshold: 5, color: '#ef4444' },
        { id: 2, name: t('dap'), category: t('fertilizer'), quantity: 12, unit: t('bags'), threshold: 5, color: '#20FFBD' },
        { id: 3, name: t('tomatoSeeds'), category: t('seeds'), quantity: 8, unit: t('pkts'), threshold: 2, color: '#20FFBD' },
        { id: 4, name: t('neemOil'), category: t('pesticide'), quantity: 5, unit: t('liters'), threshold: 2, color: '#20FFBD' },
    ];

    const burnRateData = [
        { week: 'W1', usage: 2 },
        { week: 'W2', usage: 5 },
        { week: 'W3', usage: 3 },
        { week: 'W4', usage: 8 },
    ];

    const [inventory, setInventory] = useState(initialInventory);

    const handleCheckout = (id: number) => {
        setInventory(prev => prev.map(item => {
            if (item.id === id && item.quantity > 0) {
                const newQty = item.quantity - 1;
                return { 
                    ...item, 
                    quantity: newQty,
                    color: newQty <= item.threshold ? '#ef4444' : '#20FFBD'
                };
            }
            return item;
        }));
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">
                        {t('inventoryInputTracker')}
                    </h1>
                    <p className="text-sm text-gray-400">{t('inputStockLogistics')}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest">
                        <ShoppingCart className="w-4 h-4" />
                        <span>{t('orderInputs')}</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inventory List (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <Package className="w-4 h-4 text-mint" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('liveStockLedger')}</h3>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{n(inventory.length)} {t('categoriesIntegrated')}</span>
                        </div>

                        <div className="space-y-3">
                            {inventory.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-gray-500 group-hover:text-mint transition-colors">
                                            {item.category === t('fertilizer') ? <Tag className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${item.quantity <= item.threshold ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                                {n(item.quantity)} <span className="text-[10px] text-gray-500 uppercase">{item.unit}</span>
                                            </p>
                                            <p className="text-[8px] text-gray-600 font-bold uppercase">{t('threshold')}: {n(item.threshold)}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCheckout(item.id)}
                                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                                            title={t('checkoutUnit')}
                                        >
                                            <MinusCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                         <div className="flex items-center space-x-2 mb-6">
                            <History className="w-4 h-4 text-gray-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('recentActivity')}</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start justify-between text-xs">
                                <div className="flex space-x-3">
                                    <ArrowDownLeft className="w-4 h-4 text-red-400 shrink-0" />
                                    <p className="text-gray-300">{t('ureaCheckedOut')}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold">{t('hoursAgo', { val: 2 })}</span>
                            </div>
                             <div className="flex items-start justify-between text-xs">
                                <div className="flex space-x-3">
                                    <ArrowUpRight className="w-4 h-4 text-mint shrink-0" />
                                    <p className="text-gray-300">{t('dapAdded')}</p>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold font-bold">{t('today')}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Burn Rate & Insights (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-2">
                                <BarChart3 className="w-4 h-4 text-mint" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('inputBurnRate')}</h3>
                            </div>
                            <span className="text-[8px] text-mint font-black uppercase bg-mint/10 px-2 py-0.5 rounded">{t('predictive')}</span>
                        </div>
                        
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={burnRateData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="week" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        contentStyle={{ backgroundColor: '#1B3022', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                                    />
                                    <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                                        {burnRateData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 3 ? '#20FFBD' : '#ffffff10'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-400 text-center">
                            {t('usageSpikeDetected')}
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6 bg-red-500/5 border-red-500/20">
                        <div className="flex items-center space-x-2 mb-4">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">{t('lowStockTrigger')}</h3>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed mb-4">
                            {t('ureaOutStockAdvice')}
                        </p>
                        <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            {t('restockNow')}
                        </button>
                    </GlassCard>

                    <div className="p-6 rounded-2xl bg-gradient-to-tr from-mint/5 to-white/5 border border-white/10">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{t('sustainableFarmingTip')}</h4>
                        <p className="text-xs text-gray-300 font-medium">
                            {t('farmingTipAdvice')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
