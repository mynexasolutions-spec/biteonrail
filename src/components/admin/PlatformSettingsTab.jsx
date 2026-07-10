"use client";
import React from 'react';
import {
  Search, Trash, CreditCard, Clock, Coins, CheckCircle2, Gift, Database, Phone, Plus
} from 'lucide-react';

export default function PlatformSettingsTab({
  activeSubTab,
  adminType,
  usersList,
  usersSearchQuery,
  setUsersSearchQuery,
  usersLoading,
  handleDeleteUser,
  codPolicy,
  updateCodPolicy,
  codCutoffHour,
  updateCodCutoffHour,
  deliveryCharge,
  updateDeliveryCharge,
  freeProduct,
  updateFreeProduct,
  giftThreshold,
  updateGiftThreshold,
  supportPhone,
  updateSupportPhone,
  supportEmail,
  updateSupportEmail,
  supportContacts,
  updateSupportContacts,
  socialInstagram,
  updateSocialInstagram,
  socialFacebook,
  updateSocialFacebook,
  socialTwitter,
  updateSocialTwitter
}) {
  const [newContactLabel, setNewContactLabel] = React.useState('');
  const [newContactValue, setNewContactValue] = React.useState('');
  const [newContactType, setNewContactType] = React.useState('phone');

  if (activeSubTab === 'users' && adminType === 'global') {
    return (
      <div className="space-y-6 max-w-5xl animate-fadeIn">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-808 tracking-tight uppercase">Customer User Directory</h1>
            <p className="text-slate-500 text-xs lg:text-sm mt-1">
              View and manage registered passenger accounts. Users are created automatically upon OTP verification at the checkout step.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-slate-400"><Search className="w-4 h-4" /></span>
            <input
              type="text"
              value={usersSearchQuery}
              onChange={(e) => setUsersSearchQuery(e.target.value)}
              placeholder="Search by phone number..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-500 transition-colors shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Accounts</h3>
            <span className="text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-2.5 py-1 rounded-full border border-emerald-100">
              {usersList.length} Registered Customers
            </span>
          </div>

          {usersLoading ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs animate-pulse">Loading customers from DB...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-black text-slate-450 uppercase tracking-wider border-b border-slate-150">
                    <th className="py-3.5 px-6">Phone Number</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Account Created</th>
                    <th className="py-3.5 px-6">Last Activity</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
                  {(() => {
                    const filtered = usersList.filter(u =>
                      (u.phone || '').toLowerCase().includes(usersSearchQuery.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-455 font-bold">No matching registered passenger accounts found.</td>
                        </tr>
                      );
                    }

                    return filtered.map(user => (
                      <tr key={user.phone || user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono font-black text-sm text-slate-805">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            {user.phone}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-100 text-slate-650 border border-slate-205 px-2 py-0.5 rounded uppercase text-[10px] font-bold">
                            Passenger
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-xs">
                          {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-bold text-xs">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : (user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A')}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.phone)}
                            className="text-slate-400 hover:text-red-650 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Customer Account"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeSubTab === 'config' && adminType === 'global') {
    return (
      <div className="space-y-6 max-w-5xl animate-fadeIn">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-808 tracking-tight uppercase flex items-center gap-2">
            <Database className="w-5.5 h-5.5 text-rose-550" /> Platform Settings
          </h1>
          <p className="text-slate-505 text-xs lg:text-sm mt-1">Configure system variables, order cutoff rules, cash delivery settings, and passenger incentives globally.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Payments & Deliveries */}
          <div className="space-y-6">
            {/* Time Constraint / COD Configuration */}
            <div className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
              <h2 className="text-base font-black text-slate-805 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-rose-600" /> Payment & Ordering Policy
              </h2>

              <p className="text-sm text-slate-500 leading-relaxed">Configure the Cash on Delivery (COD) availability policy for passenger orders.</p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1.5">COD Policy Mode</label>
                  <select
                    value={codPolicy}
                    onChange={(e) => updateCodPolicy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="always_allow">Always Allow COD</option>
                    <option value="always_disable">Permanently Disable COD (Prepaid Only)</option>
                    <option value="disable_after_hour">Disable COD After Specific Time</option>
                  </select>
                </div>

                {codPolicy === 'disable_after_hour' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <label className="block text-sm font-bold text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-rose-605" /> Cutoff Hour (24-Hour Format)
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                      <select
                        value={codCutoffHour}
                        onChange={(e) => updateCodCutoffHour(e.target.value)}
                        className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs font-black focus:outline-none focus:border-rose-500 cursor-pointer"
                      >
                        {Array.from({ length: 24 }).map((_, hr) => (
                          <option key={hr} value={hr}>
                            {hr === 0 ? '12:00 AM (Midnight)' : hr === 12 ? '12:00 PM (Noon)' : hr > 12 ? `${hr - 12}:00 PM` : `${hr}:00 AM`} ({String(hr).padStart(2, '0')}:00)
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-455 font-bold leading-normal">Orders placed after this time will be restricted to Prepaid Only.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seat Delivery Charge Configuration */}
            <div className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
              <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Coins className="w-4.5 h-4.5 text-rose-600" /> Convenience Fee Settings
              </h2>

              <p className="text-sm text-slate-500 leading-relaxed">Specify the standard convenience fee charged for delivering food directly to the passenger's berth/seat.</p>

              <div className="pt-2">
                <label className="block text-sm font-bold text-slate-550 mb-1.5">Berth Convenience Delivery Charge (₹)</label>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-3 top-2.5 text-slate-405 text-xs font-black">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={deliveryCharge}
                    onChange={(e) => updateDeliveryCharge(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full pl-7 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-black focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-slate-650 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Active convenience fee: ₹{deliveryCharge} per order.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Incentives & Offers */}
          <div className="space-y-6">
            {/* Promotion Configuration */}
            <div className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
              <h2 className="text-base font-black text-slate-808 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Gift className="w-4.5 h-4.5 text-rose-605" /> Free Incentive Settings
              </h2>

              <p className="text-sm text-slate-500 leading-relaxed">Specify the product and minimum order amount to reward passengers automatically. Updates apply instantly.</p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-550 mb-1.5">Free Incentive Product</label>
                  <input
                    type="text"
                    value={freeProduct}
                    onChange={(e) => updateFreeProduct(e.target.value)}
                    placeholder="e.g. Premium Water Bottle"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-550 mb-1.5">Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={giftThreshold}
                    onChange={(e) => updateGiftThreshold(e.target.value)}
                    placeholder="e.g. 300"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm font-bold focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-rose-55 rounded-xl border border-rose-100 text-xs text-slate-655 font-bold">
                <strong>Active Rule:</strong> Automatically adds "<strong>{freeProduct}</strong>" to all passenger carts with subtotal above <strong>₹{giftThreshold || 300}</strong>.
              </div>
            </div>

            {/* Social Media Links Configuration */}
            <div className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
              <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-rose-600" /> Social Media Handles
              </h2>

              <p className="text-sm text-slate-500 leading-relaxed">Customize the social media links displayed dynamically inside the public website footer.</p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-550 mb-1.5">Instagram URL</label>
                  <input
                    type="text"
                    value={socialInstagram}
                    onChange={(e) => updateSocialInstagram(e.target.value)}
                    placeholder="e.g. https://instagram.com/biteonrail"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm font-bold focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-550 mb-1.5">Facebook URL</label>
                  <input
                    type="text"
                    value={socialFacebook}
                    onChange={(e) => updateSocialFacebook(e.target.value)}
                    placeholder="e.g. https://facebook.com/biteonrail"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm font-bold focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-550 mb-1.5">Twitter / X URL</label>
                  <input
                    type="text"
                    value={socialTwitter}
                    onChange={(e) => updateSocialTwitter(e.target.value)}
                    placeholder="e.g. https://twitter.com/biteonrail"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm font-bold focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
