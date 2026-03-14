"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
  id: number;
  type: "SYSTEM" | "ALGO" | "CHAIN" | "USER";
  message: string;
  time: string;
}

const MOCK_LOGS: Omit<LogEntry, "id" | "time">[] = [
  { type: "SYSTEM", message: "Fetching IMD Temperature... 32°C" },
  { type: "ALGO", message: "Q10 Spoilage Math initialized..." },
  { type: "ALGO", message: "Shelf life projected: 48h for Tomato batch #42" },
  { type: "CHAIN", message: "Minting Batch ID #AGRI-882... Success" },
  { type: "SYSTEM", message: "Syncing regional Mandi prices..." },
  { type: "USER", message: "Query: Why Nashik price dropping?" },
  { type: "ALGO", message: "Analyzing supply shock in APMC Nashik..." },
  { type: "CHAIN", message: "Verifying transparency ledger hash: 0x8f2d...4a1" },
];

export function TechTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const newLog = {
        ...MOCK_LOGS[index % MOCK_LOGS.length],
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setLogs((prev) => [...prev.slice(-15), newLog]);
      index++;
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SYSTEM": return "text-blue-400";
      case "ALGO": return "text-mint";
      case "CHAIN": return "text-purple-400";
      case "USER": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden font-mono text-[10px] md:text-xs w-full max-w-md mx-auto shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
        <div className="text-gray-500 opacity-80 text-[10px] uppercase tracking-widest font-bold">
          Live Tech Terminal
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="p-4 h-[250px] overflow-hidden space-y-1 bg-black/80 md:bg-black/40"
      >
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start space-x-2 whitespace-nowrap"
            >
              <span className="text-gray-600">[{log.time}]</span>
              <span className={`font-bold ${getTypeColor(log.type)}`}>
                [{log.type}]:
              </span>
              <span className="text-gray-300">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-4 bg-mint/50 align-middle ml-1"
        />
      </div>
    </div>
  );
}
