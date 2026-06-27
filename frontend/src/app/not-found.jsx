import React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const Notfound = () => {
  return (
    <div className="flex h-screen w-full bg-[#0E1621]">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full blur-3xl bg-[#2B5278]/30 animate-pulse" />
          <div className="w-[120px] h-[120px] rounded-full bg-[#242F3D] flex items-center justify-center relative">
            <span className="text-[56px] font-light text-white select-none">
              404
            </span>
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-[22px] font-semibold text-white mb-2 text-center">
          Page Not Found
        </h2>
        <p className="text-[15px] text-[#8D9BAF] text-center max-w-[280px] leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Back Button */}
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-[14px] rounded-xl bg-[#2B5278] hover:bg-[#34618A] text-white text-[17px] font-medium transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Chats</span>
        </Link>
      </div>
    </div>
  );
};

export default Notfound;
