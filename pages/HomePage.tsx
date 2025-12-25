import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Typewriter from 'typewriter-effect';

const CopyrightModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            // Delay hiding to allow for fade-out animation
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        >
            <div 
                className={`bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 text-center text-white max-w-sm w-full transition-transform duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-lg font-semibold">
                    © 2025 MINI THEATRE
                </p>
                <p className="mt-2 text-sm text-gray-400">
                    Developed by SANTHOSH P.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    All rights reserved.
                </p>
                <button 
                    onClick={onClose}
                    className="mt-6 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                    Close
                </button>
            </div>
        </div>
    );
};


const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [isCopyrightOpen, setIsCopyrightOpen] = useState(false);

    return (
        <>
        <style>{`
            @keyframes spotlight-pan {
                0% { background-position: 50% 50%; }
                50% { background-position: 55% 45%; }
                100% { background-position: 50% 50%; }
            }
            @keyframes flicker {
                0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
                    opacity: 1;
                    text-shadow: 0 0 5px #fff, 0 0 15px #fff, 0 0 25px #ef4444, 0 0 40px #b91c1c;
                }
                20%, 24%, 55% {
                    opacity: 0.8;
                    text-shadow: none;
                }
            }
            @keyframes marquee-pulse {
                0%, 100% {
                    filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 20px rgba(239, 68, 68, 0.4));
                }
                50% {
                    filter: drop-shadow(0 0 20px rgba(239, 68, 68, 1)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.6));
                }
            }
            @keyframes white-glow-pulse {
                0%, 100% {
                    text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 20px #fff;
                    opacity: 1;
                }
                50% {
                    text-shadow: 0 0 2px #fff, 0 0 5px #fff, 0 0 15px #e2e8f0;
                    opacity: 0.8;
                }
            }
            @keyframes slide-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .sports-text {
                font-family: 'Impact', 'Arial Black', sans-serif;
                color: #000000;
                -webkit-text-stroke: 2px #ffffff;
                letter-spacing: -2px;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); 
            }
            .theatre-text {
                font-family: 'Limelight', cursive;
                color: #ffffff;
                letter-spacing: 0.05em;
                font-weight: 400;
                /* Multi-layered Neon Red Glow */
                text-shadow: 
                    0 0 5px #fff,
                    0 0 10px #fff,
                    0 0 20px #ef4444,
                    0 0 40px #ef4444,
                    0 0 60px #ef4444,
                    0 0 80px #ef4444;
                animation: flicker 6s infinite alternate, marquee-pulse 3s infinite ease-in-out;
            }
            .white-neon-text {
                font-family: 'Brush Script MT', 'cursive', sans-serif;
                color: #ffffff;
                /* White Neon Glow */
                text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 20px #fff;
                animation: white-glow-pulse 3s infinite ease-in-out;
            }
            .modern-btn {
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            .modern-btn:active {
                transform: scale(0.98);
            }
        `}</style>
        
        <button
            onClick={() => setIsCopyrightOpen(true)}
            className="fixed top-2 left-2 z-[100] h-8 w-8 rounded-full bg-white/10 backdrop-blur-md text-white/50 text-xs font-bold flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white hover:text-black shadow-sm focus:outline-none"
            aria-label="Show copyright information"
        >
            ©
        </button>
        
        <CopyrightModal isOpen={isCopyrightOpen} onClose={() => setIsCopyrightOpen(false)} />
        
        <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden p-4 relative bg-[#020617]">
            {/* Dramatic Spotlight Background */}
            <div 
                className="absolute inset-0 z-0 opacity-60"
                style={{
                    background: 'radial-gradient(circle at 50% 40%, #334155 0%, #1e293b 20%, #0f172a 50%, #020617 100%)',
                    animation: 'spotlight-pan 10s ease-in-out infinite'
                }}
            ></div>
            
            {/* Main Content */}
            <main className="relative z-20 flex flex-col items-center justify-center text-center w-full max-w-4xl">
                 
                 {/* Logo Container */}
                 <div className="mb-14 flex items-baseline justify-center gap-2 sm:gap-4 transform hover:scale-105 transition-transform duration-500 cursor-default">
                    {/* MINI: Sports Style */}
                    <span className="text-8xl sm:text-9xl lg:text-[10rem] font-black sports-text leading-none uppercase">
                        MINI
                    </span>
                    
                    {/* THEATRE Container */}
                    <div className="flex flex-col items-center relative -ml-2 sm:-ml-4 top-1 sm:top-0">
                        {/* THEATRE: Modern Cinematic Block Style */}
                        <span className="text-6xl sm:text-8xl lg:text-[7rem] font-black theatre-text leading-none relative z-10 uppercase italic">
                            THEATRE
                        </span>
                        {/* Let's Welcome: White Neon Subtitle */}
                        <span className="white-neon-text text-2xl sm:text-3xl lg:text-4xl absolute top-[110%] whitespace-nowrap z-0">
                            Let's Welcome
                        </span>
                    </div>
                 </div>

                {/* Typewriter */}
                <div className="h-16 sm:h-20 text-center flex items-center justify-center mt-6">
                    <Typewriter
                        options={{
                            strings: [
                            "“JUST US. JUST THE SCREEN.”",
                            "“YOUR LOVE. YOUR SCREEN.”",
                            "“A SCREEN MADE FOR TWO.”",
                            "“WHERE LOVE MEETS CINEMA.”",
                            ],
                            autoStart: true,
                            loop: true,
                            delay: 75,
                            deleteSpeed: 40,
                            wrapperClassName: "text-lg sm:text-2xl font-medium tracking-widest text-slate-400 font-sans uppercase",
                            cursorClassName: "text-lg sm:text-2xl font-light text-red-500",
                        }}
                    />
                </div>
                
                {/* Modern Pill Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-5 w-full max-w-xs sm:max-w-2xl animate-[slide-in_0.8s_ease-out_forwards]">
                    <button
                        onClick={() => navigate('/customer/menu')}
                        className="modern-btn w-full bg-white text-black font-bold py-4 px-6 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] border border-transparent tracking-wide"
                    >
                        Cafe
                    </button>
                    <button
                        onClick={() => navigate('/customer/games')}
                        className="modern-btn w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-transparent tracking-wide"
                    >
                        Screens
                    </button>
                    <button
                        onClick={() => navigate('/login-owner')}
                        className="modern-btn w-full bg-red-600 text-white font-bold py-4 px-6 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-500 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] border border-transparent tracking-wide"
                    >
                        Cafe Owner
                    </button>
                </div>
                
                {/* QR Terminal Button */}
                <div className="mt-6 w-full max-w-xs sm:max-w-md animate-[slide-in_1s_ease-out_forwards]">
                    <button
                        onClick={() => navigate('/owner/scan-terminal')}
                        className="w-full text-slate-500 font-medium py-3 px-4 rounded-full transition-all duration-300 hover:text-white hover:bg-white/5 text-sm tracking-widest uppercase"
                    >
                        Staff / QR Terminal
                    </button>
                </div>
            </main>
        </div>
        </>
    );
};

export default HomePage;