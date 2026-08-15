"use client";
import React, { useRef, useEffect } from 'react';

export default function OtpBoxInput({ value = '', onChange, length = 6, autoFocus = true }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index, e) => {
    const val = e.target.value;
    const digitsOnly = val.replace(/\D/g, '');

    if (!digitsOnly) {
      // Clear current box
      const otpArray = value.split('');
      otpArray[index] = '';
      onChange(otpArray.join(''));
      return;
    }

    if (digitsOnly.length > 1) {
      // Handle paste of full/partial OTP
      const pastedDigits = digitsOnly.slice(0, length);
      onChange(pastedDigits);
      const nextFocusIndex = Math.min(pastedDigits.length, length - 1);
      if (inputRefs.current[nextFocusIndex]) {
        inputRefs.current[nextFocusIndex].focus();
      }
      return;
    }

    // Single digit input
    const otpArray = (value.padEnd(length, ' ')).split('');
    otpArray[index] = digitsOnly[0];
    const newOtp = otpArray.join('').trim();
    onChange(newOtp);

    // Auto advance to next box
    if (index < length - 1 && digitsOnly[0]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous box if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const targetIdx = Math.min(pastedData.length, length - 1);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 my-1" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => {
        const char = value[idx] || '';
        const isFilled = !!char;
        return (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6} // Allow full paste in single input
            value={char}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-black border-2 rounded-xl sm:rounded-2xl transition-all outline-none shadow-xs select-none ${
              isFilled
                ? 'border-rose-500 bg-rose-50/40 text-rose-950 ring-2 ring-rose-500/20'
                : 'border-slate-200 bg-white text-slate-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
            }`}
          />
        );
      })}
    </div>
  );
}
