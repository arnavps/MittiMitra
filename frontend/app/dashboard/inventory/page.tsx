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

const initialInventory = [
    { id: 1, name: 'Urea (45% N)', category: 'Fertilizer', quantity: 4, unit: 'bags', threshold: 5, color: '#ef4444' },
    { id: 2, name: 'DAP', category: 'Fertilizer', quantity: 12, unit: 'bags', threshold: 5, color: '#20FFBD' },
    { id: 3, name: 'Tomato Seeds (Hybrid)', category: 'Seeds', quantity: 8, unit: 'pkts', threshold: 2, color: '#20FFBD' },
    { id: 4, name: 'Neem Oil', category: 'Pesticide', quantity: 5, unit: 'L', threshold: 2, color: '#20FFBD' },
];

const burnRateData = [
    { week: 'W1', usage: 2 },
    { week: 'W2', usage: 5 },
    { week: 'W3', usage: 3 },
    { week: 'W4', usage: 8 },
];

export default function InventoryPage() {
    const { t } = useLanguage();
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
                        {t('inventory') || "Inventory & Input Tracker"}
                    </h1>
                    <p className="text-sm text-gray-400">{t('inputLedger') || "Digital Ledger for Agricultural Inputs & Stock Logistics"}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest">
                        <ShoppingCart className="w-4 h-4" />
                        <span>{t('orderInputs') || "Order Inputs"}</span>
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
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Stock Ledger</h3>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{inventory.length} Categories Integrated</span>
                        </div>

                        <div className="space-y-3">
                            {inventory.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-gray-500 group-hover:text-mint transition-colors">
                                            {item.category === 'Fertilizer' ? <Tag className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${item.quantity <= item.threshold ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                                {item.quantity} <span className="text-[10px] text-gray-500 uppercase">{item.unit}</span>
                                            </p>
                                            <p className="text-[8px] text-gray-600 font-bold uppercase">Threshold: {item.threshold}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCheckout(item.id)}
                                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                                            title="Check out 1 unit"
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
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Activity</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start justify-between text-xs">
                                <div className="flex space-x-3">
                                    <ArrowDownLeft className="w-4 h-4 text-red-400 shrink-0" />
                                    <p className="text-gray-300"><span className="text-white font-bold">1 bag of Urea</span> checked out for Field #4</p>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold">2h ago</span>
                            </div>
                             <div className="flex items-start justify-between text-xs">
                                <div className="flex space-x-3">
                                    <ArrowUpRight className="w-4 h-4 text-mint shrink-0" />
                                    <p className="text-gray-300"><span className="text-white font-bold">10 bags of DAP</span> added from purchase #882</p>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold">Yesterday</span>
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
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Input Burn Rate</h3>
                            </div>
                            <span className="text-[8px] text-mint font-black uppercase bg-mint/10 px-2 py-0.5 rounded">Predictive</span>
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
                            Usage spike detected in <span className="text-white font-bold">Week 4</span> due to fertilization window.
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6 bg-red-500/5 border-red-500/20">
                        <div className="flex items-center space-x-2 mb-4">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">Low Stock Trigger</h3>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed mb-4">
                            <span className="font-bold text-white">Urea (45% N)</span> is below your threshold. At current burn rates, you will be out of stock by <span className="text-white font-bold">Friday</span>.
                        </p>
                        <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Restock Now
                        </button>
                    </GlassCard>

                    <div className="p-6 rounded-2xl bg-gradient-to-tr from-mint/5 to-white/5 border border-white/10">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sustainable Farming Tip</h4>
                        <p className="text-xs text-gray-300 font-medium">
                            Applying nutrients at the current dew point (detected in Weather Hub) can reduce usage by <span className="text-mint">15%</span> while maintaining yield.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
