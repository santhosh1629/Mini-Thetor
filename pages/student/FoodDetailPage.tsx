import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getMenuItemById, getFeedbacks, checkSlotAvailability } from '../../services/mockApi';
import { useAuth } from '../../context/AuthContext';
import type { MenuItem, Feedback, CartItem } from '../../types';
import Button from '../../components/common/Button';

const getCartFromStorage = (): CartItem[] => {
    try {
        const cart = localStorage.getItem('cart');
        if (!cart) return [];
        const parsed = JSON.parse(cart);
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
};

const saveCartToStorage = (cart: CartItem[]) => {
    if (!cart) return;
    localStorage.setItem('cart', JSON.stringify(cart));
};

const formatToKolkataTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return 'Invalid Time';
    return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const StarDisplay: React.FC<{ rating: number; reviewCount?: number }> = ({ rating, reviewCount }) => (
    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full w-fit">
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588 1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
        <span className="text-sm text-white font-bold">{rating.toFixed(1)}</span>
        {reviewCount !== undefined && <span className="text-xs text-white/60">({reviewCount})</span>}
    </div>
);

const FoodDetailPage: React.FC = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const { user, promptForPhone } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [item, setItem] = useState<MenuItem | null>(location.state?.item || null);
    const [reviews, setReviews] = useState<Feedback[]>([]);
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
    
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [startTimeInput, setStartTimeInput] = useState<string>(() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });
    
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [conflictInfo, setConflictInfo] = useState<{start: string, end: string} | null>(null);
    const [loading, setLoading] = useState(!item);

    const isScreen = useMemo(() => {
        if (!item) return false;
        const cat = (item.category || '').toLowerCase();
        return cat === 'game' || cat === 'screen' || (item.slotIds && item.slotIds.length > 0);
    }, [item]);

    const calculatedTimes = useMemo(() => {
        if (!item || !isScreen || !startTimeInput) return null;
        try {
            const timeParts = startTimeInput.split(':');
            const start = new Date();
            start.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
            const duration = item.durationMinutes || 60;
            const end = new Date(start.getTime() + duration * 60000);
            return {
                start: formatToKolkataTime(start),
                end: formatToKolkataTime(end),
                isoStart: start.toISOString()
            };
        } catch { return null; }
    }, [startTimeInput, item, isScreen]);

    const verifyAvailability = useCallback(async () => {
        if (!itemId || !selectedSlot || !calculatedTimes) {
            setIsAvailable(null);
            setConflictInfo(null);
            return;
        }
        setIsChecking(true);
        setIsAvailable(null);
        setConflictInfo(null);
        try {
            const result = await checkSlotAvailability(itemId, selectedSlot, calculatedTimes.isoStart, item?.durationMinutes || 60);
            setIsAvailable(result.isAvailable);
            if (result.conflict) {
                setConflictInfo(result.conflict);
            }
        } catch {
            setIsAvailable(false);
        } finally {
            setIsChecking(false);
        }
    }, [itemId, selectedSlot, calculatedTimes, item?.durationMinutes]);

    useEffect(() => {
        if (isScreen && selectedSlot) {
            const timeoutId = setTimeout(verifyAvailability, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [selectedSlot, startTimeInput, verifyAvailability, isScreen]);

    useEffect(() => {
        const fetchData = async () => {
            if (!itemId) return;
            try {
                const [itemData, allReviews] = await Promise.all([
                    getMenuItemById(itemId, user?.id),
                    getFeedbacks()
                ]);
                if (itemData) {
                    setItem(itemData);
                    setReviews(allReviews.filter(r => r.itemId === itemId));
                } else {
                     navigate('/404');
                }
            } catch (error) {
                console.error("Failed to fetch item details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [itemId, user?.id, navigate]);

     const handleAddToCart = useCallback(() => {
        if (!item) return;

        // --- MANDATORY SAFETY CHECK ---
        if (!item.isAvailable) {
            window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { message: '❌ This item is currently out of stock', type: 'cart-warn' } 
            }));
            return;
        }

        if (!user) {
            promptForPhone();
            return;
        }
        
        if (isScreen) {
            if (!selectedSlot || !startTimeInput) {
                window.dispatchEvent(new CustomEvent('show-toast', { 
                    detail: { message: '⚠️ Please select slot and start time', type: 'cart-warn' } 
                }));
                return;
            }
            
            if (isChecking) return;

            if (isAvailable === false) {
                const conflictMsg = conflictInfo 
                    ? `Booked from ${formatToKolkataTime(new Date(conflictInfo.start))} to ${formatToKolkataTime(new Date(conflictInfo.end))}`
                    : 'This slot is already booked.';
                window.dispatchEvent(new CustomEvent('show-toast', { 
                    detail: { message: `⚠️ ${conflictMsg}`, type: 'cart-warn' } 
                }));
                return;
            }
        }

        const cart = getCartFromStorage();
        let newCart: CartItem[] | null = null;
        
        if (isScreen && calculatedTimes) {
             const startDateTime = calculatedTimes.isoStart;
             const isAlreadyInCart = cart.some(ci => 
                ci.id === item.id && 
                ci.selectedSlotId === selectedSlot && 
                ci.selectedStartTime === startDateTime
             );

             if (isAlreadyInCart) {
                 window.dispatchEvent(new CustomEvent('show-toast', { 
                    detail: { message: '⚠️ This screen is already in your cart!', type: 'cart-warn' } 
                 }));
                 return;
             }
             
             newCart = [...cart, { 
                ...item, 
                quantity: 1, 
                selectedSlotId: selectedSlot || undefined, 
                selectedStartTime: startDateTime,
                durationMinutes: item.durationMinutes || 60,
                category: 'game'
             }];
        } else {
            const existingItemIndex = cart.findIndex(ci => ci.id === item.id && ci.category !== 'game');
            if (existingItemIndex > -1) {
                newCart = cart.map((ci, idx) => idx === existingItemIndex ? { ...ci, quantity: ci.quantity + 1 } : ci);
            } else {
                newCart = [...cart, { ...item, quantity: 1, category: item.category || 'food' }];
            }
        }
        
        if (newCart) {
            saveCartToStorage(newCart);
            window.dispatchEvent(new CustomEvent('itemAddedToCart'));
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { message: '✅ Added to Cart!', type: 'cart-add' } 
            }));
        }
    }, [user, item, isScreen, selectedSlot, startTimeInput, calculatedTimes, isAvailable, isChecking, conflictInfo, promptForPhone]);


    if (loading) {
        return (
            <div className="animate-pulse max-w-4xl mx-auto pt-6">
                <div className="bg-surface/50 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-surface-light h-96"></div>
            </div>
        );
    }

    if (!item) return null;

    // Single source of truth for the button disabled state.
    // For food, ONLY isAvailable matters.
    // For screens, isAvailable matters AND slot selection logic.
    const isActuallyDisabled = !item.isAvailable || (isScreen && (!selectedSlot || isAvailable === false || isChecking));

    return (
        <div className="pb-24 animate-fade-in-right relative z-10">
            <div className="flex items-center mb-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <span className="ml-2 font-bold text-lg text-white font-heading">Back</span>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="bg-surface/50 backdrop-blur-xl border border-surface-light p-6 rounded-3xl shadow-2xl text-white overflow-hidden relative">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className={`rounded-2xl overflow-hidden shadow-lg aspect-video md:aspect-square bg-black/30 ${!item.isAvailable ? 'grayscale opacity-60' : ''}`}>
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"/>
                        </div>
                        
                        <div className="flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-3xl font-extrabold leading-tight font-heading">{item.emoji} {item.name}</h1>
                                {!item.isAvailable && (
                                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full animate-pulse uppercase">Out of Stock</span>
                                )}
                            </div>
                            
                            {item.averageRating != null && (
                                <div className="mb-4">
                                    <StarDisplay rating={item.averageRating} reviewCount={reviews.length} />
                                </div>
                            )}

                            <div className="p-4 bg-black/20 rounded-xl border border-white/5 shadow-inner">
                                <p className="text-sm text-gray-300 uppercase font-bold tracking-wider mb-1">Price</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-primary font-heading">₹{item.price.toFixed(0)}</p>
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">per booking</span>
                                </div>
                                {isScreen && item.durationMinutes && (
                                    <p className="text-sm text-indigo-300 mt-2 flex items-center gap-1 font-semibold italic">⏱️ Duration: {item.durationMinutes} Mins</p>
                                )}
                            </div>
                            
                            {isScreen && item.slotIds && item.isAvailable && (
                                <div className="mt-6 animate-fade-in-up">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-white uppercase tracking-wider text-xs">Select Slot</h4>
                                        <div className="flex items-center gap-2">
                                            {isChecking && <span className="text-[10px] animate-pulse text-indigo-400 font-black">Checking...</span>}
                                            {isAvailable === true && <span className="text-[10px] text-green-400 font-black">✅ Available</span>}
                                            {isAvailable === false && <span className="text-[10px] text-red-400 font-black">❌ Booked</span>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {item.slotIds.map(slotId => (
                                            <button
                                                key={slotId}
                                                type="button"
                                                onClick={() => { setSelectedSlot(slotId); setIsAvailable(null); }}
                                                className={`py-3 px-3 rounded-lg text-sm font-bold border transition-all duration-200 h-14 flex items-center justify-center pointer-events-auto
                                                    ${selectedSlot === slotId
                                                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                                                        : 'bg-black/40 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/10'}`}
                                            >
                                                {slotId}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-6">
                                        <h4 className="font-bold text-white mb-2 uppercase tracking-wider text-xs">Start Time</h4>
                                        <input 
                                            type="time" 
                                            value={startTimeInput}
                                            onChange={(e) => { setStartTimeInput(e.target.value); setIsAvailable(null); }}
                                            className="w-full bg-black/40 border border-indigo-500/30 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xl shadow-inner pointer-events-auto"
                                        />
                                    </div>
                                    
                                    {calculatedTimes && (
                                        <div className={`mt-5 p-4 border rounded-xl text-sm transition-all duration-300 ${isAvailable === false ? 'bg-red-900/30 border-red-500/50' : 'bg-indigo-900/40 border-indigo-500/30'}`}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-gray-400 text-[10px] uppercase font-bold">Start: {calculatedTimes.start}</span>
                                                <span className="text-gray-400 text-[10px] uppercase font-bold">End: {calculatedTimes.end}</span>
                                            </div>
                                            {isAvailable === false && conflictInfo && (
                                                <p className="text-red-400 font-bold mt-2 text-xs">🚫 Already booked till {formatToKolkataTime(new Date(conflictInfo.end))}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-auto pt-8">
                                <Button 
                                    type="button"
                                    onClick={handleAddToCart} 
                                    fullWidth 
                                    disabled={isActuallyDisabled}
                                    className={`text-lg py-5 shadow-2xl transition-all relative z-20 ${isActuallyDisabled ? 'opacity-50 pointer-events-none' : 'active:scale-95 pointer-events-auto'}`}
                                >
                                    {!item.isAvailable 
                                        ? 'Out of Stock' 
                                        : isScreen 
                                            ? (isChecking ? 'Verifying...' : (isAvailable === false ? 'Already Booked' : (selectedSlot ? 'Add screen to Cart' : 'Select a Slot'))) 
                                            : 'Add to Cart'
                                    }
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodDetailPage;