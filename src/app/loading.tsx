export default function GlobalLoading() {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#C89B35]/20 border-t-[#C89B35] animate-spin" />
        <div className="absolute w-6 h-6 rounded-full border-2 border-[#8C6D23]/30 border-b-[#8C6D23] animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
      </div>
      <p className="mt-4 text-sm font-medium text-[#8C6D23] animate-pulse">
        กำลังโหลดข้อมูล...
      </p>
    </div>
  );
}
