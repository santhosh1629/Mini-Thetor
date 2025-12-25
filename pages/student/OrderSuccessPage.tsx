import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import type { Order } from '../../types';
import { OrderStatus } from '../../types';
import { getOrderById, updateOrderSeatNumber } from '../../services/mockApi';

const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [seatNumber, setSeatNumber] = useState('');
  const [seatSubmitted, setSeatSubmitted] = useState(false);
  const location = useLocation();
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (location.state?.showSuccessToast) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Payment Confirmed!', type: 'payment-success' } }));
    }
  }, [location.state]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          const orderData = await getOrderById(orderId);
          setOrder(orderData);
          setCurrentStatus(orderData.status);
          if (orderData.seatNumber) {
            setSeatNumber(orderData.seatNumber);
            setSeatSubmitted(true);
          }
        } catch (error) {
          console.error("Fetch error", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrder();

    // Long polling for status changes
    if (orderId) {
        const intervalId = setInterval(async () => {
            try {
                const updatedOrder = await getOrderById(orderId);
                const newStatus = updatedOrder.status;
                if (newStatus !== currentStatus) {
                    setCurrentStatus(newStatus);
                    setOrder(updatedOrder);
                    if (newStatus === OrderStatus.COLLECTED || newStatus === OrderStatus.COMPLETED) {
                        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Order Collected! Enjoy your movie!', type: 'payment-success' } }));
                    }
                }
            } catch (e) {}
        }, 5000);
        return () => clearInterval(intervalId);
    }
  }, [orderId, currentStatus]);

  const handleSeatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seatNumber.trim() && orderId) {
      try {
        await updateOrderSeatNumber(orderId, seatNumber.trim());
        setSeatSubmitted(true);
      } catch(error) {
        alert("Retry screen update.");
      }
    }
  };

  if (loading) return <div className="max-w-md mx-auto h-96 bg-surface/30 rounded-[3rem] animate-pulse"></div>;
  if (!order) return <div className="text-center text-red-400 py-20">Order lost in the cinematic void.</div>;

  const isFinished = currentStatus === OrderStatus.COLLECTED || currentStatus === OrderStatus.COMPLETED;
  const qrValue = JSON.stringify({ type: 'ORDER_QR', token: order.qrToken });

  return (
    <div className="max-w-md mx-auto bg-surface/50 backdrop-blur-3xl border border-white/5 p-8 sm:p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] text-textPrimary animate-fade-in-up">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${isFinished ? 'border-green-500 bg-green-500/20 text-green-500' : 'border-primary bg-primary/20 text-primary'} animate-scale-in`}>
             {isFinished ? (
                 <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
             ) : (
                 <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             )}
          </div>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
          {isFinished ? "Collected!" : "Confirmed"}
        </h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Order #{order.id.slice(-6)}</p>
      </div>

      <div className="mt-10 flex flex-col items-center">
        <div className={`relative p-6 bg-white rounded-3xl border-4 ${isFinished ? 'border-green-500 grayscale' : 'border-primary shadow-2xl shadow-primary/30'}`}>
          <QRCode value={qrValue} size={180} fgColor="#000000" bgColor="#FFFFFF" />
          {isFinished && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                <span className="text-black font-black text-4xl -rotate-12 uppercase">COLLECTED</span>
            </div>
          )}
        </div>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-4 text-center">
           {isFinished ? "DELIVERY LOGGED" : "PRESENT THIS QR TO STAFF"}
        </p>
      </div>
      
      {!seatSubmitted && !isFinished && (
        <div className="mt-10 pt-10 border-t-2 border-dashed border-white/5">
            <form onSubmit={handleSeatSubmit} className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Detail Required</p>
                <input type="text" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} placeholder="ENTER SCREEN #" className="w-full text-center text-3xl font-black py-4 bg-black/40 border-2 border-white/10 rounded-2xl focus:border-primary transition-all uppercase" required />
                <button type="submit" className="w-full bg-primary text-background font-black py-4 rounded-2xl uppercase tracking-widest active:scale-95 transition-transform">Confirm Location</button>
            </form>
        </div>
      )}

      <div className="mt-10 bg-black/40 p-6 rounded-3xl border border-white/5">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Item Status</h3>
        <div className="space-y-3">
          {(order.items || []).map(item => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-300">{item.name} <span className="text-indigo-400 ml-1">x{item.quantity}</span></span>
                  <span className="font-black">{item.isDelivered ? '✅' : '⏳'}</span>
              </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-baseline">
            <span className="text-xs font-black uppercase text-gray-400">Paid Total</span>
            <span className="text-2xl font-black text-primary">₹{order.totalAmount.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;