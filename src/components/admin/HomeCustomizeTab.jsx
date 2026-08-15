"use client";
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../lib/cloudinary';
import { Image, CheckCircle, Search, Sparkles, Monitor, Smartphone, ShieldCheck, Heart, Upload, BarChart3 } from 'lucide-react';

export default function HomeCustomizeTab() {
  const {
    stations,
    menuItems,
    homepageHeroDesktop,
    updateHomepageHeroDesktop,
    homepageHeroMobile,
    updateHomepageHeroMobile,
    homepageShowcase1,
    updateHomepageShowcase1,
    homepageShowcase2,
    updateHomepageShowcase2,
    homepagePopularDishes,
    updateHomepagePopularDishes,
    statsPassengers,
    updateStatsPassengers,
    statsEateries,
    updateStatsEateries,
    statsRating,
    updateStatsRating,
    statsJunctions,
    updateStatsJunctions,
    homepageLogo,
    updateHomepageLogo,
    homepageLogoWhite,
    updateHomepageLogoWhite
  } = useApp();

  // Search items filter state
  const [dishSearchQuery, setDishSearchQuery] = useState('');

  // Uploading state tracking for individual fields
  const [uploadingField, setUploadingField] = useState(null); // 'hero_desktop' | 'hero_mobile' | 'showcase_1' | 'showcase_2' | 'logo' | 'logo_white'

  const handleFileUpload = async (e, fieldKey, updateFn) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingField(fieldKey);

      if (!isCloudinaryConfigured()) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          await updateFn(reader.result);
          setUploadingField(null);
          alert("Image saved locally (Base64) successfully!");
        };
        reader.onerror = () => {
          alert("Failed to read image locally.");
          setUploadingField(null);
        };
        reader.readAsDataURL(file);
        return;
      }

      const url = await uploadToCloudinary(file);
      await updateFn(url);
      alert("Image uploaded to Cloudinary successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploadingField(null);
    }
  };

  // Toggle dish selection (must keep total selection to 4)
  const handleTogglePopularDish = async (dishId) => {
    let currentSelected = [...(homepagePopularDishes || [])];
    if (currentSelected.includes(dishId)) {
      currentSelected = currentSelected.filter(id => id !== dishId);
    } else {
      if (currentSelected.length >= 4) {
        alert("You can select a maximum of 4 popular dishes to showcase on the home page! Deselect one first.");
        return;
      }
      currentSelected.push(dishId);
    }
    await updateHomepagePopularDishes(currentSelected);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const isGlobal = !item.station_code || item.station_code.toUpperCase() === 'ALL';
    const matchesSearch = item.name.toLowerCase().includes(dishSearchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(dishSearchQuery.toLowerCase());
    return isGlobal && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-5xl animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-600" />
          Home Page Customization
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Upload custom hero wallpapers, manage Berth showcase assets, and select exactly 4 popular items to display on the main page.
        </p>
      </div>

      {/* Brand Logo Customization Panel */}
      <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden p-6 space-y-6">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-rose-500" /> Brand Logo Customization
        </h3>
        <p className="text-xs text-slate-500 font-semibold leading-normal">
          Upload your custom corporate logo to display dynamically across the entire website (Navbar header, Footer, and mobile overlays).
        </p>

        {/* Main Primary Logo */}
        <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between max-w-md mx-auto">
          <div>
            <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
              🎨 Brand Logo
            </span>
            <h4 className="font-extrabold text-slate-800 text-sm mt-3">Primary Transparent Logo</h4>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
              Upload a PNG logo with a transparent background. Best recommended resolution is landscape format.
            </p>
            <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-slate-100 flex items-center justify-center min-h-[100px] relative">
              <img
                src={homepageLogo || "/logo.png"}
                alt="Primary Logo Preview"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center justify-center bg-white hover:bg-rose-50 border border-slate-250 hover:border-rose-300 text-slate-700 hover:text-rose-600 p-2.5 rounded-xl cursor-pointer transition-all shadow-xs w-full max-w-[120px] mx-auto gap-2">
              <Upload className="w-4 h-4 shrink-0" />
              {uploadingField === 'logo' && <span className="text-[10px] font-black uppercase">...</span>}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingField !== null}
                onChange={(e) => handleFileUpload(e, 'logo', updateHomepageLogo)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Image Upload Panel */}
      <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden p-6 space-y-6">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <Image className="w-4 h-4 text-slate-500" /> Banner & Section Artwork Customization
        </h3>

        <div className="space-y-6">
          {/* Card 1: Desktop Hero (Full width) */}
          <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
                <Monitor className="w-3 h-3" /> Laptop / Desktop Hero
              </span>
              <h4 className="font-extrabold text-slate-800 text-sm mt-3">Hero Section Background Wallpaper</h4>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                Recommended aspect ratio: 16:9 or 21:9 (1920x1080px resolution). Matches background Vande Bharat train.
              </p>
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden aspect-[21/9] bg-slate-100 relative">
                <img
                  src={homepageHeroDesktop || "/herobanner.png"}
                  alt="Desktop Hero preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center justify-center bg-white hover:bg-rose-55 border border-slate-250 hover:border-rose-300 text-slate-700 hover:text-rose-600 p-2.5 rounded-xl cursor-pointer transition-all shadow-xs w-full max-w-[120px] mx-auto gap-2">
                <Upload className="w-4 h-4 shrink-0" />
                {uploadingField === 'hero_desktop' && <span className="text-[10px] font-black uppercase">...</span>}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingField !== null}
                  onChange={(e) => handleFileUpload(e, 'hero_desktop', updateHomepageHeroDesktop)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Grid layout for Mobile Hero and Showcase cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Card 2: Mobile Hero */}
            <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Mobile View Hero
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm mt-3">Hero Section Mobile Background</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                  Recommended aspect ratio: Portrait layout (4:5 or 3:4 is optimal for mobile banner screens).
                </p>
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden aspect-[4/5] bg-slate-100 relative">
                  <img
                    src={homepageHeroMobile || "/mobile_hero.png"}
                    alt="Mobile Hero preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="mt-4">
              <label className="flex items-center justify-center bg-white hover:bg-rose-55 border border-slate-250 hover:border-rose-300 text-slate-700 hover:text-rose-600 p-2.5 rounded-xl cursor-pointer transition-all shadow-xs w-full max-w-[120px] mx-auto gap-2">
                <Upload className="w-4 h-4 shrink-0" />
                {uploadingField === 'hero_mobile' && <span className="text-[10px] font-black uppercase">...</span>}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingField !== null}
                  onChange={(e) => handleFileUpload(e, 'hero_mobile', updateHomepageHeroMobile)}
                  className="hidden"
                />
              </label>
              </div>
            </div>

            {/* Card 3: Showcase Image 1 */}
            <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Showcase Card 1
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm mt-3">Express Speed Showcase Image</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                  Displays inside "Delicious Food, Served at Your Berth" section left column block (default Vande Bharat image).
                </p>
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden aspect-square bg-slate-100 relative">
                  <img
                    src={homepageShowcase1 || "/vande_bharat.png"}
                    alt="Showcase 1 preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="mt-4">
              <label className="flex items-center justify-center bg-white hover:bg-rose-55 border border-slate-250 hover:border-rose-300 text-slate-700 hover:text-rose-600 p-2.5 rounded-xl cursor-pointer transition-all shadow-xs w-full max-w-[120px] mx-auto gap-2">
                <Upload className="w-4 h-4 shrink-0" />
                {uploadingField === 'showcase_1' && <span className="text-[10px] font-black uppercase">...</span>}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingField !== null}
                  onChange={(e) => handleFileUpload(e, 'showcase_1', updateHomepageShowcase1)}
                  className="hidden"
                />
              </label>
              </div>
            </div>

            {/* Card 4: Showcase Image 2 */}
            <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Showcase Card 2
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm mt-3">Hygienic Meal Showcase Image</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                  Displays inside "Delicious Food, Served at Your Berth" section right column block (default train meal delivery box).
                </p>
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden aspect-square bg-slate-100 relative">
                  <img
                    src={homepageShowcase2 || "/train_food_delivery.png"}
                    alt="Showcase 2 preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="mt-4">
              <label className="flex items-center justify-center bg-white hover:bg-rose-55 border border-slate-250 hover:border-rose-300 text-slate-700 hover:text-rose-600 p-2.5 rounded-xl cursor-pointer transition-all shadow-xs w-full max-w-[120px] mx-auto gap-2">
                <Upload className="w-4 h-4 shrink-0" />
                {uploadingField === 'showcase_2' && <span className="text-[10px] font-black uppercase">...</span>}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingField !== null}
                  onChange={(e) => handleFileUpload(e, 'showcase_2', updateHomepageShowcase2)}
                  className="hidden"
                />
              </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Scale Statistics Panel */}
      <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden p-6 space-y-6">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-indigo-500" /> Trust & Scale Statistics
        </h3>
        <p className="text-xs text-slate-500 font-semibold leading-normal">
          Customize the trust metrics shown in the "Who We Are & What We Do" section on the home page.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-550 mb-1.5 font-mono uppercase tracking-wider">Happy Passengers</label>
            <input
              type="text"
              value={statsPassengers}
              onChange={(e) => updateStatsPassengers(e.target.value)}
              placeholder="e.g. 5k+"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-805 text-sm font-bold focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-550 mb-1.5 font-mono uppercase tracking-wider">Eateries Partners</label>
            <input
              type="text"
              value={statsEateries}
              onChange={(e) => updateStatsEateries(e.target.value)}
              placeholder="e.g. 80+"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-805 text-sm font-bold focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-550 mb-1.5 font-mono uppercase tracking-wider">Average Rating</label>
            <input
              type="text"
              value={statsRating}
              onChange={(e) => updateStatsRating(e.target.value)}
              placeholder="e.g. 4.8"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-805 text-sm font-bold focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Select Menu Items Panel */}
      <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-100" /> Popular Dishes Selector
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">
              Select exactly 4 items to display on the Passenger Favorites slider.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
              (homepagePopularDishes || []).length === 4
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {(homepagePopularDishes || []).length} of 4 Selected
            </span>

            <div className="relative w-48 sm:w-60">
              <span className="absolute left-3 top-2.5 text-slate-455"><Search className="w-3.5 h-3.5" /></span>
              <input
                type="text"
                value={dishSearchQuery}
                onChange={(e) => setDishSearchQuery(e.target.value)}
                placeholder="Search dish or category..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-4 text-slate-800 placeholder-slate-455 text-xs focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => {
              const isSelected = (homepagePopularDishes || []).includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleTogglePopularDish(item.id)}
                  className={`border p-3.5 rounded-[22px] cursor-pointer transition-all duration-200 flex items-center gap-3 relative group ${
                    isSelected
                      ? 'border-rose-300 bg-rose-55/20 shadow-sm shadow-rose-100'
                      : 'border-slate-200 hover:border-slate-355 hover:bg-slate-50/30'
                  }`}
                >
                  {/* Dish image or placeholder */}
                  {item.image_url || item.image ? (
                    <img
                      src={item.image_url || item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-150 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center shrink-0 text-rose-600 text-sm font-bold">
                      🍽
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-black leading-tight line-clamp-1 ${
                      isSelected ? 'text-rose-655' : 'text-slate-800'
                    }`}>
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 block">
                      {item.category} • ₹{item.price}
                    </span>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 text-rose-600">
                      <CheckCircle className="w-4 h-4 fill-rose-50 text-rose-600" />
                    </div>
                  )}
                </div>
              );
            })}

            {filteredMenuItems.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 font-bold text-xs">
                No matching menu items found in active station catalogs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
