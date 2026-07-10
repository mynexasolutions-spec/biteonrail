"use client";
import React from 'react';
import { useApp } from '../../context/AppContext';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../lib/cloudinary';
import {
  Plus, Trash, Check, X, Coffee, Database, CheckCircle2, AlertTriangle,
  Search, Pencil, IndianRupee, Upload, ClipboardList, Eye, Image, Globe
} from 'lucide-react';

export default function MenuCatalogTab({
  activeSubTab,
  setActiveSubTab,
  adminType,
  selectedStationCode,
  baseMenuItems,
  menuItems,
  categories,
  addCategory,
  removeCategory,
  updateCategory,
  menuSearchQuery,
  setMenuSearchQuery,
  menuSortBy,
  setMenuSortBy,
  menuAvailabilityFilter,
  setMenuAvailabilityFilter,
  menuActiveCategory,
  setMenuActiveCategory,
  menuViewMode,
  setMenuViewMode,
  menuPageSize,
  setMenuPageSize,
  menuSelectedIds,
  setMenuSelectedIds,
  displayMenuItems,
  totalMenuFilteredCount,
  menuStartIndex,
  menuCurrentPage,
  setMenuCurrentPage,
  newItemName,
  setNewItemName,
  newItemPrice,
  setNewItemPrice,
  newItemCategory,
  setNewItemCategory,
  newItemStationCode,
  setNewItemStationCode,
  newItemFoodType,
  setNewItemFoodType,
  uploadedUrl,
  setUploadedUrl,
  newItemDescription,
  setNewItemDescription,
  hasVariants,
  setHasVariants,
  itemVariants,
  setItemVariants,
  stations,
  uploading,
  handleImageUpload,
  handleAddMenuItem,
  startEditMenuItem,
  cancelEditMenuItem,
  handleEditMenuItemSubmit,
  handleBulkAvailability,
  handleBulkDelete,
  handleUpdatePriceInline,
  handleToggleItemAvailability,
  handleRemoveMenuItem,
  editingMenuItem,
  editingPriceId,
  setEditingPriceId,
  editingPriceValue,
  setEditingPriceValue,
  newCategoryName,
  setNewCategoryName,
  editingCategory,
  setEditingCategory,
  editCategoryName,
  setEditCategoryName,
  toggleGlobalItemAvailability,
  menuOriginFilter,
  setMenuOriginFilter
}) {
  const { categories: rawCategories, globalOverrides, resolveItemAvailability } = useApp();
  const [newCategoryImage, setNewCategoryImage] = React.useState('');
  const [uploadingCat, setUploadingCat] = React.useState(false);
  const [editCategoryImage, setEditCategoryImage] = React.useState(null);

  const [isMenuModalOpen, setIsMenuModalOpen] = React.useState(false);
  const [viewingItem, setViewingItem] = React.useState(null);
  const [categoryTypeFilter, setCategoryTypeFilter] = React.useState('all');
  if (activeSubTab === 'menu') {
    const inStockCount = baseMenuItems.filter(item => item.available).length;
    const outOfStockCount = baseMenuItems.filter(item => !item.available).length;

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-6">

          {/* Live Menu Catalog Statistics Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Dishes</span>
                <span className="text-xl font-black text-slate-800">{baseMenuItems.length}</span>
              </div>
              <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                <Coffee className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Active Stock</span>
                <span className="text-xl font-black text-emerald-655">{inStockCount}</span>
              </div>
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Sold Out</span>
                <span className="text-xl font-black text-rose-650">{outOfStockCount}</span>
              </div>
              <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-555" />
              </div>
            </div>
          </div>

          {/* Header Title & Filter Controls */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="text-sm lg:text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-rose-550" />
                  {adminType === 'station' ? `Catalog: ${selectedStationCode}` : 'Global Menu Catalog'}
                </h2>
                <p className="text-[11px] lg:text-sm text-slate-505 font-medium">Easily search, paginate, and edit pricing for your pantry items.</p>
              </div>
              {adminType === 'global' && (
                <div className="w-full mt-3 flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3">
                  <Globe className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] lg:text-sm font-black text-indigo-800">Global Items — Visible on All Stations</p>
                    <p className="text-[10px] lg:text-xs text-indigo-600 font-medium mt-0.5">Items added here (with Hub = "All Stations") appear on every station's menu. Station admins can toggle them available/unavailable for their own station — but cannot edit or delete them.</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[10px] lg:text-xs text-slate-555 font-black uppercase bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  Filtered: {totalMenuFilteredCount} Items
                </span>
                <button
                  onClick={() => {
                    cancelEditMenuItem();
                    setIsMenuModalOpen(true);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-4 py-2 rounded-xl text-[10px] lg:text-xs transition-colors flex items-center gap-1 shadow-sm uppercase tracking-wider shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
            </div>

            {/* Inline Search and Advanced Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              <div className={`relative ${adminType !== 'global' ? 'md:col-span-4' : 'md:col-span-6'}`}>
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => { setMenuSearchQuery(e.target.value); setMenuCurrentPage(1); }}
                  placeholder="Search items by name, description..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs lg:text-sm focus:outline-none focus:border-rose-500 font-bold text-slate-855 placeholder-slate-400"
                />
              </div>

              <select
                value={menuSortBy}
                onChange={(e) => setMenuSortBy(e.target.value)}
                className={`${adminType !== 'global' ? 'md:col-span-3' : 'md:col-span-3'} bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs lg:text-sm font-bold text-slate-705 focus:outline-none focus:border-rose-500 cursor-pointer`}
              >
                <option value="nameAsc">Sort: Name (A-Z)</option>
                <option value="nameDesc">Sort: Name (Z-A)</option>
                <option value="priceLow">Sort: Price (Low → High)</option>
                <option value="priceHigh">Sort: Price (High → Low)</option>
                <option value="statusStock">Sort: In Stock First</option>
              </select>

              <select
                value={menuAvailabilityFilter}
                onChange={(e) => { setMenuAvailabilityFilter(e.target.value); setMenuCurrentPage(1); }}
                className={`${adminType !== 'global' ? 'md:col-span-3' : 'md:col-span-3'} bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs lg:text-sm font-bold text-slate-705 focus:outline-none focus:border-rose-500 cursor-pointer`}
              >
                <option value="All">Stock Status: All</option>
                <option value="InStock">Status: In Stock Only</option>
                <option value="SoldOut">Status: Sold Out Only</option>
              </select>

              {adminType !== 'global' && (
                <select
                  value={menuOriginFilter || 'All'}
                  onChange={(e) => { setMenuOriginFilter(e.target.value); setMenuCurrentPage(1); }}
                  className="md:col-span-2 bg-slate-50 border border-indigo-100 focus:border-rose-500 rounded-xl px-3 py-2.5 text-xs lg:text-sm font-black text-indigo-700 cursor-pointer"
                >
                  <option value="All">Items: All Origin</option>
                  <option value="Local">Origin: Local Menu</option>
                  <option value="Global">Origin: Global Menu</option>
                </select>
              )}
            </div>

            {/* Categories & Layout Switches */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100 pt-4 flex-wrap">
              {/* Category Pills Filters */}
              <div className="flex flex-wrap gap-1.5">
                {['All', ...categories].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setMenuActiveCategory(cat); setMenuCurrentPage(1); }}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all border ${menuActiveCategory === cat
                      ? 'bg-rose-600 border-rose-650 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* View Mode & Page Size */}
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-105 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMenuViewMode('list')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${menuViewMode === 'list' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-550'}`}
                  >
                    List View
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuViewMode('grid')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${menuViewMode === 'grid' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-550'}`}
                  >
                    Grid View
                  </button>
                </div>

                <select
                  value={menuPageSize}
                  onChange={(e) => { setMenuPageSize(Number(e.target.value)); setMenuCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-black text-slate-500 cursor-pointer focus:outline-none"
                >
                  <option value={10}>10 Per Page</option>
                  <option value={20}>20 Per Page</option>
                  <option value={50}>50 Per Page</option>
                  <option value={100}>100 Per Page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions Console */}
          {menuSelectedIds.length > 0 && (
            <div className="bg-rose-50/50 border border-rose-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 animate-fadeIn">
              <div className="text-xs text-rose-800 font-extrabold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rose-600 animate-bounce" />
                <span>Selected {menuSelectedIds.length} items for bulk modifications</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleBulkAvailability(true)}
                  className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-emerald-700 font-bold border border-emerald-200 px-3.5 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all"
                >
                  ● In Stock
                </button>
                <button
                  onClick={() => handleBulkAvailability(false)}
                  className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-slate-500 font-bold border border-slate-300 px-3.5 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all"
                >
                  ○ Sold Out
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-550 text-white font-extrabold px-3.5 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm"
                >
                  Bulk Delete
                </button>
              </div>
            </div>
          )}

          {/* Menu Catalog Listing */}
          {displayMenuItems.length > 0 ? (
            menuViewMode === 'list' ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs lg:text-sm font-black text-slate-450 uppercase tracking-widest">
                        <th className="py-4 px-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={displayMenuItems.every(item => menuSelectedIds.includes(item.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const pageIds = displayMenuItems.map(item => item.id);
                                setMenuSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
                              } else {
                                const pageIds = displayMenuItems.map(item => item.id);
                                setMenuSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
                              }
                            }}
                            className="rounded border-slate-355 text-rose-655 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                        </th>
                        <th className="py-4 px-4 w-[36%] text-left">Item Details</th>
                        <th className="py-4 px-4 w-[20%] text-left">{adminType === 'station' ? 'Category' : 'Category / Station'}</th>
                        <th className="py-4 px-4 w-[16%] text-left">Price</th>
                        <th className="py-4 px-4 w-[18%] text-center">Status</th>
                        <th className="py-4 px-4 w-[10%] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayMenuItems.map(item => {
                        const isSelected = menuSelectedIds.includes(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/50 transition-colors duration-150 ${item.available ? '' : 'bg-slate-50/20 opacity-80'}`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setMenuSelectedIds(prev => prev.filter(id => id !== item.id));
                                  } else {
                                    setMenuSelectedIds(prev => [...prev, item.id]);
                                  }
                                }}
                                className="rounded border-slate-355 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {item.image_url || item.image ? (
                                  <img
                                    src={item.image_url || item.image}
                                    alt={item.name}
                                    loading="lazy"
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-150 shrink-0 hover:scale-110 transition-transform duration-205 cursor-pointer"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-rose-55 border border-rose-100 rounded-xl flex items-center justify-center shrink-0 text-rose-600 font-bold">
                                    🍽
                                  </div>
                                )}
                                <div>
                                  <span className="font-extrabold text-slate-800 text-sm lg:text-base flex items-center gap-1.5 leading-tight">
                                    {item.food_type === 'veg' && (
                                      <span className="w-3.5 h-3.5 border border-emerald-600 p-[1.5px] flex items-center justify-center shrink-0 bg-white" title="Veg">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                                      </span>
                                    )}
                                    {item.food_type === 'non-veg' && (
                                      <span className="w-3.5 h-3.5 border border-amber-800 p-[1px] flex items-center justify-center shrink-0 bg-white" title="Non-Veg">
                                        <svg className="w-2 h-2 fill-amber-800" viewBox="0 0 100 100">
                                          <polygon points="50,15 90,85 10,85" />
                                        </svg>
                                      </span>
                                    )}
                                    {item.name}
                                  </span>
                                  <span className="text-xs lg:text-sm text-slate-400 line-clamp-1 mt-0.5 font-medium">{item.description || 'No description provided.'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <span className="text-[10px] lg:text-xs text-rose-655 bg-rose-55 border border-rose-100 px-2 py-0.5 rounded uppercase tracking-wider block w-max font-black">
                                  {item.category}
                                </span>
                                {adminType !== 'station' && (
                                  <span className="text-[10px] lg:text-xs text-slate-505 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-max">
                                    Hub: {item.station_code || 'ALL'}
                                  </span>
                                )}
                                {(item.station_code || 'ALL').toUpperCase() === 'ALL' && (
                                  <span className="text-[9px] lg:text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-0.5 w-max">
                                    <Globe className="w-2.5 h-2.5" /> Global
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-left font-bold">
                              {item.variants && item.variants.length > 0 ? (
                                <div className="text-left space-y-1">
                                  {item.variants.map((v, idx) => (
                                    <span key={idx} className="font-extrabold text-slate-800 text-xs lg:text-sm block leading-none">
                                      {v.name}: ₹{v.price}
                                    </span>
                                  ))}
                                </div>
                              ) : editingPriceId === item.id ? (
                                <div className="flex gap-1 justify-start items-center">
                                  <span className="text-xs font-black text-slate-500">₹</span>
                                  <input
                                    type="number"
                                    value={editingPriceValue}
                                    onChange={(e) => setEditingPriceValue(e.target.value)}
                                    className="w-16 bg-white border border-rose-500 rounded px-1.5 py-1 text-xs lg:text-sm font-black text-slate-805 text-left focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdatePriceInline(item.id, editingPriceValue)}
                                    className="bg-emerald-500 hover:bg-emerald-605 text-white p-1 rounded transition-colors"
                                    title="Save Price"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPriceId(null)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1 rounded transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-start gap-1.5 group cursor-pointer" onClick={() => { setEditingPriceId(item.id); setEditingPriceValue(item.price); }}>
                                  <span className="font-black text-rose-655 text-sm lg:text-base flex items-center">
                                    <IndianRupee className="w-3.5 h-3.5" />{item.price}
                                  </span>
                                  <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {(() => {
                                const isGlobal = (item.station_code || 'ALL').toUpperCase() === 'ALL';
                                const isStationAdmin = adminType === 'station';
                                const effectiveAvail = isGlobal && isStationAdmin
                                  ? resolveItemAvailability(item, selectedStationCode)
                                  : item.available !== false;
                                const handleClick = () => {
                                  if (isGlobal && isStationAdmin) {
                                    toggleGlobalItemAvailability(item.id, selectedStationCode, !effectiveAvail);
                                  } else {
                                    handleToggleItemAvailability(item.id);
                                  }
                                };
                                return (
                                  <button
                                    type="button"
                                    onClick={handleClick}
                                    className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100/70 px-2.5 py-1.5 rounded-full transition-all duration-200 shadow-sm whitespace-nowrap"
                                  >
                                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center ${effectiveAvail ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                                      <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${effectiveAvail ? 'text-emerald-705' : 'text-slate-500'}`}>
                                      {effectiveAvail ? 'Available' : 'Not Available'}
                                    </span>
                                    {isGlobal && isStationAdmin && (
                                      <span className="text-[8px] text-indigo-600 font-black ml-0.5">(Local)</span>
                                    )}
                                  </button>
                                );
                              })()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setViewingItem(item); }}
                                  className="text-slate-400 hover:text-emerald-650 p-1.5 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-150"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    startEditMenuItem(item);
                                    setIsMenuModalOpen(true);
                                  }}
                                  disabled={(item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station'}
                                  className={`p-1.5 rounded-lg transition-colors border ${ (item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station' ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border-slate-200 hover:border-indigo-150' }`}
                                  title={(item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station' ? 'Global items can only be edited by Head Admin' : 'Edit Item'}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMenuItem(item.id)}
                                  disabled={(item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station'}
                                  className={`p-1.5 rounded-lg transition-colors inline-block border ${ (item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station' ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-650 hover:bg-rose-50 border-slate-200 hover:border-rose-150' }`}
                                  title={(item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station' ? 'Global items cannot be deleted by station admins' : 'Delete Item'}
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayMenuItems.map(item => (
                  <div key={item.id} className={`bg-white border p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:shadow-md relative ${item.available ? 'border-slate-200' : 'border-slate-250 bg-slate-50/50 opacity-75'}`}>
                    <input
                      type="checkbox"
                      checked={menuSelectedIds.includes(item.id)}
                      onChange={() => {
                        if (menuSelectedIds.includes(item.id)) {
                          setMenuSelectedIds(prev => prev.filter(id => id !== item.id));
                        } else {
                          setMenuSelectedIds(prev => [...prev, item.id]);
                        }
                      }}
                      className="absolute right-4 top-4 rounded border-slate-350 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                    />

                    <div className="flex gap-4">
                      {item.image_url || item.image ? (
                        <img
                          src={item.image_url || item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0 hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center shrink-0 text-rose-500">
                          <Coffee className="w-6 h-6" />
                        </div>
                      )}
                      <div className="space-y-1 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] text-rose-600 font-extrabold bg-rose-55 border border-rose-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.category}</span>
                          {adminType !== 'station' && (
                            <span className="text-[9px] text-slate-505 bg-slate-100 border border-slate-205 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                              Hub: {item.station_code || 'ALL'}
                            </span>
                          )}
                          {(item.station_code || 'ALL').toUpperCase() === 'ALL' && (
                            <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-black uppercase flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5" /> Global
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          {item.food_type === 'veg' && (
                            <span className="w-3.5 h-3.5 border border-emerald-600 p-[1.5px] flex items-center justify-center shrink-0 bg-white" title="Veg">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                            </span>
                          )}
                          {item.food_type === 'non-veg' && (
                            <span className="w-3.5 h-3.5 border border-amber-800 p-[1px] flex items-center justify-center shrink-0 bg-white" title="Non-Veg">
                              <svg className="w-2 h-2 fill-amber-800" viewBox="0 0 100 100">
                                <polygon points="50,15 90,85 10,85" />
                              </svg>
                            </span>
                          )}
                          {item.name}
                        </h3>
                        {item.variants && item.variants.length > 0 && (
                          <span className="text-[9px] text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-black mt-1 inline-block uppercase tracking-wider">
                            Sizes: {item.variants.map(v => `${v.name} (₹${v.price})`).join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100 text-xs">
                      <span className="font-black text-rose-600 text-sm">
                        {item.variants && item.variants.length > 0 ? `₹${item.variants[0].price} onwards` : `₹${item.price}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const isGlobal = (item.station_code || 'ALL').toUpperCase() === 'ALL';
                          const isStationAdmin = adminType === 'station';
                          const effectiveAvail = isGlobal && isStationAdmin
                            ? resolveItemAvailability(item, selectedStationCode)
                            : item.available !== false;
                          const handleClick = () => {
                            if (isGlobal && isStationAdmin) {
                              toggleGlobalItemAvailability(item.id, selectedStationCode, !effectiveAvail);
                            } else {
                              handleToggleItemAvailability(item.id);
                            }
                          };
                          return (
                            <button
                              type="button"
                              onClick={handleClick}
                              className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100/70 px-2 py-1 rounded-full transition-all duration-200 shadow-sm"
                            >
                              <div className={`w-7 h-3.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${effectiveAvail ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-wider ${effectiveAvail ? 'text-emerald-705' : 'text-slate-500'}`}>
                                {effectiveAvail ? 'Available' : 'Not Available'}
                              </span>
                              {isGlobal && isStationAdmin && (
                                <span className="text-[7px] text-indigo-600 font-black">(Local)</span>
                              )}
                            </button>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setViewingItem(item); }}
                          className="text-slate-400 hover:text-emerald-650 p-1.5 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-100"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            startEditMenuItem(item);
                            setIsMenuModalOpen(true);
                          }}
                          disabled={(item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station'}
                          className={`p-1.5 rounded-lg transition-colors border ${ (item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station' ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-650 bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-100' }`}
                          title={(item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station' ? 'Global items can only be edited by Head Admin' : 'Edit Item'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMenuItem(item.id)}
                          disabled={(item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station'}
                          className={`p-1.5 rounded-lg transition-colors border ${ (item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station' ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border-slate-200 hover:border-rose-100' }`}
                          title={(item.station_code || 'ALL').toUpperCase() === 'ALL' && adminType === 'station' ? 'Global items cannot be deleted by station admins' : 'Delete Item'}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs shadow-sm font-semibold">
              No matching menu items found. Add some from the right sidebar.
            </div>
          )}

          {/* Pagination controls */}
          {totalMenuFilteredCount > menuPageSize && (
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-xs gap-3">
              <span className="text-slate-505 font-semibold">
                Showing <strong className="text-slate-808">{menuStartIndex + 1}</strong> to <strong className="text-slate-808">{Math.min(menuStartIndex + menuPageSize, totalMenuFilteredCount)}</strong> of <strong className="text-slate-808">{totalMenuFilteredCount}</strong> items
              </span>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setMenuCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={menuCurrentPage === 1}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: Math.ceil(totalMenuFilteredCount / menuPageSize) }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isNearCurrent = Math.abs(pageNum - menuCurrentPage) <= 1;
                  const isFirstOrLast = pageNum === 1 || pageNum === Math.ceil(totalMenuFilteredCount / menuPageSize);
                  if (!isNearCurrent && !isFirstOrLast) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setMenuCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-xl border transition-all font-black ${menuCurrentPage === pageNum
                        ? 'bg-rose-600 border-rose-650 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setMenuCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalMenuFilteredCount / menuPageSize)))}
                  disabled={menuCurrentPage === Math.ceil(totalMenuFilteredCount / menuPageSize)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Unified Create/Edit Menu Item Modal */}
      {isMenuModalOpen && (
        <div 
          className="fixed top-0 left-0 w-screen h-screen bg-slate-950/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
        >
          <div 
            className="bg-white rounded-3xl sm:rounded-[32px] p-4 sm:p-6 max-w-md md:max-w-lg w-full max-h-[90vh] sm:max-h-[96vh] flex flex-col shadow-2xl relative z-10 animate-slideUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar inside Centered Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                  {editingMenuItem ? <Pencil className="w-5 h-5 text-rose-550" /> : <Plus className="w-5 h-5 text-rose-550" />}
                </div>
                <div>
                  <h3 className="font-black text-slate-850 text-sm">{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pantry Catalog</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMenuModalOpen(false);
                  cancelEditMenuItem();
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Container */}
            <div className="flex-grow overflow-y-auto py-2 scrollbar-hide">
              <form 
                onSubmit={(e) => {
                  if (editingMenuItem) {
                    handleEditMenuItemSubmit(e);
                  } else {
                    handleAddMenuItem(e);
                  }
                  setIsMenuModalOpen(false);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Vada Pav"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Food Type Option */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Food Type Indicator</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItemFoodType('veg')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                        newItemFoodType === 'veg'
                          ? 'bg-emerald-50 border-emerald-350 text-emerald-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 border border-emerald-600 p-[1px] flex items-center justify-center shrink-0 bg-white" title="Veg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                      </span>
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemFoodType('non-veg')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                        newItemFoodType === 'non-veg'
                          ? 'bg-rose-50 border-rose-350 text-rose-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 border border-amber-800 p-[1px] flex items-center justify-center shrink-0 bg-white" title="Non-Veg">
                        <svg className="w-2 h-2 fill-amber-800" viewBox="0 0 100 100">
                          <polygon points="50,15 90,85 10,85" />
                        </svg>
                      </span>
                      Non-Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemFoodType('')}
                      className={`flex items-center justify-center py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                        newItemFoodType === ''
                          ? 'bg-slate-100 border-slate-350 text-slate-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Standard
                    </button>
                  </div>
                </div>

                {/* Dynamic Variants Toggle Option */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                    />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Enable Sizes / Variants</span>
                  </label>

                  {hasVariants ? (
                    <div className="space-y-2.5 animate-fadeIn">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Define Sizes & Prices</label>
                      {itemVariants.map((v, idx) => (
                        <div key={idx} className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            placeholder="e.g. Half Plate"
                            value={v.name}
                            onChange={(e) => {
                              const updated = [...itemVariants];
                              updated[idx].name = e.target.value;
                              setItemVariants(updated);
                            }}
                            required
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-bold focus:outline-none focus:border-rose-500"
                          />
                          <input
                            type="number"
                            placeholder="₹ Price"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...itemVariants];
                              updated[idx].price = e.target.value;
                              setItemVariants(updated);
                            }}
                            required
                            className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-bold focus:outline-none focus:border-rose-500 font-mono"
                          />
                          {itemVariants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setItemVariants(prev => prev.filter((_, i) => i !== idx))}
                              className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-100 transition-colors"
                              title="Delete Variant Size"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setItemVariants(prev => [...prev, { name: '', price: '' }])}
                        className="w-full py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Size Size Option
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Standard Item Price (₹)</label>
                      <input
                        type="number"
                        required={!hasVariants}
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="₹ price key"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs font-bold focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Assigned Station filter configuration */}
                {adminType === 'global' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-550 mb-1.5">Assigned Delivery Hub</label>
                    <select
                      value={newItemStationCode}
                      onChange={(e) => setNewItemStationCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-855 text-xs font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="ALL">All Stations (ALL)</option>
                      {stations.map(st => (
                        <option key={st.id} value={st.code}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Category Group</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    {categories.map(cat => {
                      const rawCatObj = (rawCategories || []).find(c => {
                        const matchExact = (c.name || '').toLowerCase() === cat.toLowerCase();
                        const matchLegacy = c.name && c.name.includes(':') && c.name.split(':')[1].toLowerCase() === cat.toLowerCase();
                        return matchExact || matchLegacy;
                      });
                      const isGlobal = !rawCatObj?.station_code || rawCatObj.station_code.toUpperCase() === 'ALL';
                      return (
                        <option key={cat} value={cat}>
                          {cat} {isGlobal ? '(Global)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
                    <span>Dish Display Image</span>
                    {uploadedUrl && (
                      <button
                        type="button"
                        onClick={() => setUploadedUrl('')}
                        className="text-[10px] text-rose-650 hover:text-rose-700 font-black uppercase tracking-wider flex items-center gap-0.5"
                      >
                        <Trash className="w-3 h-3" /> Remove Photo
                      </button>
                    )}
                  </label>
                  <div className="flex justify-center mt-1">
                    <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-dashed border-slate-200 hover:border-rose-450 bg-slate-50/50 transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center shadow-sm">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="menu-image-upload-modal"
                      />
                      
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-rose-550 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Uploading...</span>
                        </div>
                      ) : uploadedUrl ? (
                        <label htmlFor="menu-image-upload-modal" className="cursor-pointer w-full h-full block relative">
                          <img
                            src={uploadedUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white gap-1.5">
                            <Upload className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Change Photo</span>
                          </div>
                        </label>
                      ) : (
                        <label htmlFor="menu-image-upload-modal" className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-4 gap-2 text-slate-500 hover:text-rose-600 transition-colors">
                          <Upload className="w-7 h-7 text-slate-400 group-hover:text-rose-550 transition-colors" />
                          <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-wider block">Upload Image</span>
                            <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">1:1 Ratio (Square)</span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Ingredients and prep style..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuModalOpen(false);
                      cancelEditMenuItem();
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-rose-600 hover:bg-rose-505 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {editingMenuItem ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingMenuItem ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
        {/* Item Details View Modal */}
        {viewingItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col transform transition-all">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <span className="text-[10px] text-rose-600 font-extrabold uppercase tracking-widest bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                    {viewingItem.category}
                  </span>
                   <h3 className="text-base font-black text-slate-800 mt-1.5 flex items-center gap-1.5">
                     {viewingItem.food_type === 'veg' && (
                       <span className="w-3.5 h-3.5 border border-emerald-600 p-[1.5px] flex items-center justify-center shrink-0 bg-white" title="Veg">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                       </span>
                     )}
                     {viewingItem.food_type === 'non-veg' && (
                       <span className="w-3.5 h-3.5 border border-amber-800 p-[1px] flex items-center justify-center shrink-0 bg-white" title="Non-Veg">
                         <svg className="w-2 h-2 fill-amber-800" viewBox="0 0 100 100">
                           <polygon points="50,15 90,85 10,85" />
                         </svg>
                       </span>
                     )}
                     {viewingItem.name}
                   </h3>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 p-2 rounded-xl transition-all shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] scrollbar-hide">
                {/* Image */}
                {viewingItem.image_url || viewingItem.image ? (
                  <img
                    src={viewingItem.image_url || viewingItem.image}
                    alt={viewingItem.name}
                    className="w-full aspect-square object-cover rounded-2xl border border-slate-100 shadow-inner"
                  />
                ) : (
                  <div className="w-full h-32 bg-rose-50/40 border border-dashed border-rose-150 rounded-2xl flex flex-col items-center justify-center text-rose-550">
                    <Coffee className="w-10 h-10 mb-1" />
                    <span className="text-xs font-bold">No Image Available</span>
                  </div>
                )}

                {/* Description */}
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-150">
                    {viewingItem.description || 'No description provided.'}
                  </p>
                </div>

                {/* Status / Station Info */}
                <div className={adminType === 'station' ? 'block' : 'grid grid-cols-2 gap-4'}>
                  {adminType !== 'station' && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Station / Hub</span>
                      <span className="text-xs font-black text-slate-707 uppercase mt-0.5 block">
                        {viewingItem.station_code || 'ALL'}
                      </span>
                    </div>
                  )}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Stock Status</span>
                    <span className={`text-xs font-black mt-0.5 block ${viewingItem.available ? 'text-emerald-650' : 'text-rose-600'}`}>
                      {viewingItem.available ? '● In Stock' : '○ Sold Out'}
                    </span>
                  </div>
                </div>

                {/* Prices & Sizes */}
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5">Pricing Details</span>
                  {viewingItem.variants && viewingItem.variants.length > 0 ? (
                    <div className="space-y-2">
                      {viewingItem.variants.map((v, i) => (
                        <div key={i} className="flex justify-between items-center bg-rose-50/40 border border-rose-100/50 p-3 rounded-xl">
                          <span className="text-xs font-black text-slate-700">{v.name}</span>
                          <span className="text-xs font-black text-rose-600">₹{v.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-rose-50/40 border border-rose-100/50 p-3 rounded-xl">
                      <span className="text-xs font-black text-slate-705">Standard Price</span>
                      <span className="text-xs font-black text-rose-600">₹{viewingItem.price}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (activeSubTab === 'categories') {
    const handleCatImageUpload = async (e, isEdit = false) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setUploadingCat(true);

        if (!isCloudinaryConfigured()) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isEdit) {
              setEditCategoryImage(reader.result);
            } else {
              setNewCategoryImage(reader.result);
            }
            setUploadingCat(false);
            alert("Image saved locally (Base64) successfully!");
          };
          reader.onerror = () => {
            alert("Failed to read image locally.");
            setUploadingCat(false);
          };
          reader.readAsDataURL(file);
          return;
        }

        const url = await uploadToCloudinary(file);
        if (isEdit) {
          setEditCategoryImage(url);
        } else {
          setNewCategoryImage(url);
        }
        alert("Category image uploaded successfully!");
      } catch (err) {
        console.error("Category upload error:", err);
        alert("Failed to upload category image: " + err.message);
      } finally {
        setUploadingCat(false);
      }
    };

    const filteredCategoriesToRender = categories.filter(cat => {
      if (adminType === 'global') return true;
      const rawCatObj = (rawCategories || []).find(c => {
        const matchExact = (c.name || '').toLowerCase() === cat.toLowerCase();
        const matchLegacy = c.name && c.name.includes(':') && c.name.split(':')[1].toLowerCase() === cat.toLowerCase();
        return matchExact || matchLegacy;
      });
      const isGlobal = !rawCatObj?.station_code || rawCatObj.station_code.toUpperCase() === 'ALL';

      if (categoryTypeFilter === 'global') return isGlobal;
      if (categoryTypeFilter === 'local') return !isGlobal;
      return true;
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Categories list table (Left Side) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-sm lg:text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <ClipboardList className="w-4.5 h-4.5 text-rose-550" />
                {adminType === 'global' ? 'Global Categories' : 'Active Pantry Categories'}
              </h2>
              <p className="text-[11px] lg:text-sm text-slate-555 font-medium">Manage and edit classifications for passenger menus.</p>
            </div>
            <span className="text-[10px] lg:text-xs text-slate-500 font-black uppercase bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm">
              Filtered Categories: {filteredCategoriesToRender.length}
            </span>
          </div>

          {adminType === 'global' && (
            <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3">
              <Globe className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] lg:text-sm font-black text-indigo-800">Global Categories — Shared Across All Stations</p>
                <p className="text-[10px] lg:text-xs text-indigo-600 font-medium mt-0.5">Categories created here are available to all station admins when adding their menu items. Station admins can assign items to these categories but cannot delete them.</p>
              </div>
            </div>
          )}

          {/* Filter selector tabs for station admins */}
          {adminType !== 'global' && (
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all ${
                  categoryTypeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('local')}
                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all ${
                  categoryTypeFilter === 'local' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Created By You
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('global')}
                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all ${
                  categoryTypeFilter === 'global' ? 'bg-white text-indigo-600 shadow-xs border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Global Categories
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] lg:text-sm font-black text-slate-450 uppercase tracking-widest">
                    <th className="py-4 px-6 w-16 text-center">S.No</th>
                    <th className="py-4 px-6">Category Detail</th>
                    <th className="py-4 px-6 w-48 text-center">Linked Items</th>
                    <th className="py-4 px-6 w-32 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategoriesToRender.map((cat, index) => {
                    const displayCatName = cat.includes(':') ? cat.split(':')[1] : cat;
                    const itemCount = menuItems.filter(item => item.category === cat || item.category === displayCatName).length;

                    // Lookup category image
                    const rawCatObj = (rawCategories || []).find(c => {
                      const matchExact = (c.name || '').toLowerCase() === cat.toLowerCase();
                      const matchLegacy = c.name && c.name.includes(':') && c.name.split(':')[1].toLowerCase() === cat.toLowerCase();
                      return matchExact || matchLegacy;
                    });
                    const categoryImage = rawCatObj?.image;

                    return (
                      <tr key={cat} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-center font-bold text-slate-400 font-mono">{index + 1}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                              {editingCategory === cat ? (
                                editCategoryImage ? (
                                  <img src={editCategoryImage} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <Image className="w-5 h-5 text-slate-350" />
                                )
                              ) : (
                                categoryImage ? (
                                  <img src={categoryImage} alt={displayCatName} className="w-full h-full object-cover" />
                                ) : (
                                  <Coffee className="w-5 h-5 text-slate-400" />
                                )
                              )}
                            </div>

                            <div className="flex flex-col">
                              {editingCategory === cat ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editCategoryName}
                                    onChange={(e) => setEditCategoryName(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-3 py-1.5 text-slate-800 text-xs font-black focus:outline-none w-full max-w-xs"
                                    required
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded cursor-pointer font-bold hover:bg-indigo-100 transition-all">
                                      {uploadingCat ? "Uploading..." : "Change Image"}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadingCat}
                                        onChange={(e) => handleCatImageUpload(e, true)}
                                        className="hidden"
                                      />
                                    </label>
                                    {editCategoryImage && (
                                      <button
                                        type="button"
                                        onClick={() => setEditCategoryImage('')}
                                        className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-bold hover:bg-rose-100 transition-all"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (() => {
                                const isGlobal = !rawCatObj?.station_code || rawCatObj.station_code.toUpperCase() === 'ALL';
                                return (
                                  <span className="font-extrabold text-slate-800 text-sm lg:text-base flex items-center gap-1.5">
                                    {displayCatName}
                                    {isGlobal && (
                                      <span className="text-[9px] lg:text-xs text-indigo-755 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                        Global
                                      </span>
                                    )}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 text-[10px] lg:text-xs text-rose-707 bg-rose-55 border border-rose-100 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                            <Coffee className="w-3.5 h-3.5 text-rose-550" /> {itemCount} Dishes
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {editingCategory === cat ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editCategoryName.trim()) {
                                      updateCategory(cat, editCategoryName.trim(), editCategoryImage);
                                    }
                                    setEditingCategory(null);
                                  }}
                                  className="text-emerald-705 p-1.5 bg-emerald-55 hover:bg-emerald-100 border border-emerald-150 rounded-lg transition-all"
                                  title="Save Changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategory(null)}
                                  className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (() => {
                              const isGlobal = !rawCatObj?.station_code || rawCatObj.station_code.toUpperCase() === 'ALL';
                              const disabled = isGlobal && adminType !== 'global';
                              return (
                                <>
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                      setEditingCategory(cat);
                                      setEditCategoryName(displayCatName);
                                      setEditCategoryImage(categoryImage || '');
                                    }}
                                    className={`p-1.5 border rounded-lg transition-colors ${
                                      disabled
                                        ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                                        : 'text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border-slate-200 hover:border-indigo-150'
                                    }`}
                                    title={disabled ? 'Global categories can only be edited by Head Admin' : 'Edit Category'}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to remove the category "${displayCatName}"? This does NOT delete the food items, but they will need a new category.`)) {
                                        removeCategory(cat);
                                      }
                                    }}
                                    className={`p-1.5 border rounded-lg transition-colors ${
                                      disabled
                                        ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                                        : 'text-slate-400 hover:text-rose-650 hover:bg-rose-50 border-slate-200 hover:border-rose-150'
                                    }`}
                                    title={disabled ? 'Global categories cannot be deleted by station admins' : 'Delete Category'}
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create Category form (Right Side) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
            <h3 className="font-black text-slate-808 text-sm border-b border-slate-100 pb-2">Create Category</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategoryName.trim()) {
                  addCategory(newCategoryName.trim(), newCategoryImage);
                  setNewCategoryName('');
                  setNewCategoryImage('');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. South Indian, Desserts..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Category Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                    {newCategoryImage ? (
                      <img src={newCategoryImage} alt="Category preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-6 h-6 text-slate-350" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="bg-white border border-slate-250 hover:border-rose-300 text-slate-700 hover:text-rose-600 text-[10px] font-black px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-xs text-center">
                      {uploadingCat ? "Uploading..." : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingCat}
                        onChange={(e) => handleCatImageUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                    {newCategoryImage && (
                      <button
                        type="button"
                        onClick={() => setNewCategoryImage('')}
                        className="text-[10px] text-slate-500 hover:text-rose-600 font-bold text-left px-1.5"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-sm uppercase tracking-wider"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
