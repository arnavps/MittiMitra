"use client";

import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CommunityGroups } from '@/components/CommunityGroups';
import { saveDraft, getDrafts, deleteDraft, CommunityDraft } from '@/utils/communityDB';

interface Answer {
    id: string;
    author_name: string;
    voice_url?: string;
    text_content: string;
    timestamp: string;
}

interface Post {
    id: string;
    author_name: string;
    title: string;
    voice_url?: string;
    text_content: string;
    tags: string[];
    answers: Answer[];
    timestamp: string;
    location_cluster: string;
}

export default function CommunityPage() {
    const { t, n, language } = useLanguage();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState("");
    const [newPostContent, setNewPostContent] = useState("");
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [drafts, setDrafts] = useState<CommunityDraft[]>([]);
    
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    useEffect(() => {
        fetchPosts();
        loadDrafts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/community/posts');
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error("Failed to fetch posts", err);
        } finally {
            setLoading(false);
        }
    };

    const loadDrafts = async () => {
        const d = await getDrafts();
        setDrafts(d);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
                setAudioBlob(blob);
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Recording failed", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    const handleContentChange = async (content: string) => {
        setNewPostContent(content);
        if (content.length > 10) {
            // Debounced tagging could be better, but for demo:
            try {
                const res = await fetch('/api/community/tag', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: content })
                });
                const data = await res.json();
                setSuggestedTags(data.tags);
            } catch (err) {
                console.error("Tagging failed", err);
            }
        }
    };

    const handleSaveDraft = async () => {
        const draft: CommunityDraft = {
            id: Date.now().toString(),
            title: newPostTitle,
            text_content: newPostContent,
            voice_blob: audioBlob || undefined,
            timestamp: Date.now()
        };
        await saveDraft(draft);
        loadDrafts();
        setShowNewPost(false);
        resetForm();
    };

    const resetForm = () => {
        setNewPostTitle("");
        setNewPostContent("");
        setAudioBlob(null);
        setSuggestedTags([]);
    };

    const submitPost = async () => {
        setLoading(true);
        const newPost: Post = {
            id: Date.now().toString(),
            author_name: "You",
            title: newPostTitle,
            text_content: newPostContent,
            tags: suggestedTags,
            answers: [],
            timestamp: new Date().toISOString(),
            location_cluster: "Nashik-East"
        };

        try {
            await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPost)
            });
            fetchPosts();
            setShowNewPost(false);
            resetForm();
        } catch (err) {
            console.error("Submission failed, saving to drafts", err);
            handleSaveDraft();
        } finally {
            setLoading(false);
        }
    };

    if (loading && posts.length === 0) {
        return <div className="h-screen flex items-center justify-center bg-[#1B3022]"><div className="w-10 h-10 border-4 border-mint border-t-transparent animate-spin rounded-full"></div></div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 pb-24">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-mint/20 rounded-xl flex items-center justify-center border border-mint/30 shadow-[0_0_20px_rgba(32,255,189,0.1)]">
                            <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{t('communityHub')}</h1>
                    </div>
                    <p className="text-gray-400 font-medium">{t('chowkGroundTruth')}</p>
                </div>
                <button 
                    onClick={() => setShowNewPost(true)}
                    className="px-6 py-3 bg-mint text-forest font-bold rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(32,255,189,0.3)] uppercase tracking-widest text-xs"
                >
                    {t('postQuestion')}
                </button>
            </div>

            {/* Offline Drafts Alert */}
            {drafts.length > 0 && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <p className="text-sm font-bold text-orange-400 uppercase tracking-widest">{t('offlineDraftsSync', { count: n(drafts.length) })}</p>
                    </div>
                </div>
            )}

            {/* Groups Grid */}
            <CommunityGroups />

            {/* Main Forum Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white/80">{t('activeDiscussions')}</h2>
                    {posts.map((post, idx) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <GlassCard className="p-6 border-white/5 hover:border-mint/30 transition-all group overflow-hidden">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                {post.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] font-black text-mint/80 bg-mint/5 px-2 py-0.5 rounded-full border border-mint/10">{tag}</span>
                                                ))}
                                            </div>
                                            <h3 className="text-xl font-extrabold text-white group-hover:text-mint transition-colors tracking-tight">{post.title}</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('askedBy', { author: post.author_name, location: post.location_cluster })}</p>
                                        </div>
                                        <button className="text-gray-500 hover:text-white transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                                        </button>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">{post.text_content}</p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex -space-x-2">
                                            {[1,2,3].map(i => (
                                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-forest bg-gradient-to-tr from-mint/40 to-teal-500/40 flex items-center justify-center text-[10px] font-bold`}>
                                                    {i}
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-forest bg-white/10 flex items-center justify-center text-[8px] font-bold text-gray-400">+{n(post.answers.length)}</div>
                                        </div>
                                        <button className="text-xs font-black text-mint uppercase tracking-widest flex items-center space-x-2 group/btn">
                                            <span>{t('joinConversation')}</span>
                                            <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white/80">{t('trendingTopics')}</h2>
                    <GlassCard className="p-6 border-white/5">
                        <div className="space-y-4">
                            {[
                                { tag: "#PriceShock", count: 42, color: "text-red-400" },
                                { tag: "#TomatoLateBlight", count: 28, color: "text-orange-400" },
                                { tag: "#OperationsGreens", count: 15, color: "text-mint" },
                                { tag: "#StorageTrolley", count: 12, color: "text-blue-400" }
                            ].map(topic => (
                                <div key={topic.tag} className="flex justify-between items-center group cursor-pointer">
                                    <span className={`text-sm font-bold ${topic.color} group-hover:underline`}>{topic.tag}</span>
                                    <span className="text-[10px] text-gray-600 font-black">{n(topic.count)} {t('posts')}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* New Post Modal */}
            <AnimatePresence>
                {showNewPost && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNewPost(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        >
                            <GlassCard className="w-full max-w-lg p-8 space-y-6 border-white/20 relative">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{t('askCommunity')}</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1 block">{t('titleMainQuestion')}</label>
                                        <input 
                                            value={newPostTitle}
                                            onChange={(e) => setNewPostTitle(e.target.value)}
                                            placeholder={t('placeholderHarvestUpdate')}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-mint/50 focus:ring-1 focus:ring-mint/50 outline-none transition-all"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1 block">{t('voiceContextOptional')}</label>
                                        <div className="flex items-center space-x-3">
                                            <button 
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl border transition-all ${isRecording ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                            >
                                                {isRecording ? (
                                                    <>
                                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                        <span className="text-xs font-black uppercase tracking-widest">{t('recordingClickToStop')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                        <span className="text-xs font-black uppercase tracking-widest">{t('addVoiceExplanation')}</span>
                                                    </>
                                                )}
                                            </button>
                                            {audioBlob && !isRecording && (
                                                <div className="w-12 h-12 rounded-xl bg-mint/20 flex items-center justify-center text-mint border border-mint/30">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1 block">{t('fullDescription')}</label>
                                        <textarea 
                                            value={newPostContent}
                                            onChange={(e) => handleContentChange(e.target.value)}
                                            rows={4}
                                            placeholder={t('placeholderGroundTruth')}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-mint/50 focus:ring-1 focus:ring-mint/50 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2 min-h-[20px]">
                                        {suggestedTags.map(tag => (
                                            <span key={tag} className="text-[10px] font-black text-mint bg-mint/5 px-2 py-0.5 rounded-full border border-mint/20">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button 
                                        onClick={() => setShowNewPost(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button 
                                        onClick={submitPost}
                                        className="flex-1 py-3 bg-mint text-forest font-black rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(32,255,189,0.3)] uppercase tracking-widest text-[10px]"
                                    >
                                        {t('postNow')}
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
