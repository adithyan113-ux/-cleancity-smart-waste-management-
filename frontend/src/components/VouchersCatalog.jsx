import React, { useState, useEffect } from 'react';
import {
  Gift,
  Award,
  Copy,
  Check,
  Sparkles,
  ShoppingBag,
  Clock,
  ExternalLink,
  AlertCircle,
  Tag
} from 'lucide-react';
import { api } from '../services/api';

export default function VouchersCatalog({ points, onPointsUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRedeem = async (catalogItem) => {
    if (points < catalogItem.points_cost) {
      setAlertMsg({
        type: 'error',
        text: `You have ${points} points, but ${catalogItem.points_cost} points are needed to redeem this voucher.`
      });
      return;
    }

    try {
      setRedeemingId(catalogItem.id);
      setAlertMsg(null);
      const res = await api.redeemVoucher(catalogItem);
      setAlertMsg({
        type: 'success',
        text: `Successfully unlocked ${catalogItem.title}! Code: ${res.voucher.code}`
      });
      onPointsUpdated(res.remaining_points);
      await loadVouchers();
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Redemption failed' });
    } finally {
      setRedeemingId(null);
    }
  };

  const catalog = data?.voucher_catalog || [
    { id: 'v-1', title: '$5 Grocery Green Discount', partner_name: 'EcoFresh Market', points_cost: 100, discount_text: '$5.00 Off' },
    { id: 'v-2', title: '$10 Public Transit Smart Pass', partner_name: 'City Metro Transit', points_cost: 100, discount_text: '$10.00 Credit' },
    { id: 'v-3', title: '$15 Zero-Waste Cafe Voucher', partner_name: 'Earth Beans Cafe', points_cost: 100, discount_text: '$15.00 Voucher' },
    { id: 'v-4', title: '$20 Renewable Home Energy Credit', partner_name: 'CleanGrid Utility', points_cost: 200, discount_text: '$20.00 Rebate' }
  ];

  const userVouchers = data?.user_vouchers || [];

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-green-700 text-white rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
              <Gift className="w-3.5 h-3.5" aria-hidden="true" />
              <span>EcoRewards Partner Catalog</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Redeem CleanCity Points
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-lg">
              Exchange points earned from reporting illegal garbage for grocery discounts, transit rides, and local cafe perks.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-300" aria-hidden="true" />
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-100 block">Your Balance</span>
              <span className="text-2xl font-black">{points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
          role="alert"
        >
          {alertMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Available Rewards Catalog */}
      <section aria-label="Available Vouchers to Redeem">
        <h2 className="text-base font-bold text-slate-900 mb-3">Available Partner Vouchers</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {catalog.map((item) => {
            const canAfford = points >= item.points_cost;
            const isRedeeming = redeemingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                    <span className="text-emerald-700">{item.partner_name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[11px]">
                      {item.discount_text}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Instant voucher code redeemable in-store or online checkout.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Cost</span>
                    <strong className="text-sm font-black text-slate-900">{item.points_cost} pts</strong>
                  </div>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={!canAfford || isRedeeming}
                    className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    aria-label={`Redeem ${item.title} for ${item.points_cost} points`}
                  >
                    <Gift className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isRedeeming ? 'Redeeming...' : canAfford ? 'Redeem' : 'Need Points'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* User's Claimed Vouchers History */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs" aria-label="Claimed Vouchers">
        <h2 className="text-base font-bold text-slate-900 mb-1">Your Claimed Vouchers</h2>
        <p className="text-xs text-slate-500 mb-3.5">Active codes ready to be presented at partners</p>

        {userVouchers.length === 0 ? (
          <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Tag className="w-6 h-6 text-slate-300 mx-auto mb-1" aria-hidden="true" />
            <p className="text-xs font-semibold text-slate-600">No vouchers redeemed yet.</p>
            <p className="text-[11px] text-slate-400">Reach 100 points to claim your first reward!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {userVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="p-3 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-900">{voucher.title}</span>
                    <span className="text-[11px] font-bold text-emerald-700 px-1.5 py-0.2 bg-emerald-100 rounded">
                      {voucher.partner_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Redeemed on {new Date(voucher.created_at).toLocaleDateString()} • Value: {voucher.discount_text}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300">
                    {voucher.code}
                  </code>
                  <button
                    onClick={() => handleCopy(voucher.code)}
                    className="min-h-[44px] min-w-[44px] p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-colors"
                    aria-label={`Copy voucher code ${voucher.code}`}
                  >
                    {copiedCode === voucher.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
